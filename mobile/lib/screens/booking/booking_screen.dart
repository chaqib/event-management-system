import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/events_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../models/event.dart';

class BookingScreen extends StatefulWidget {
  final String eventId;
  final String ticketId;
  const BookingScreen({super.key, required this.eventId, required this.ticketId});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  Event? _event;
  Map<String, dynamic>? _ticket;
  int _quantity = 1;
  bool _loading = true;
  bool _booking = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final event = await context.read<EventsProvider>().fetchEventById(widget.eventId);
    if (event != null && event.tickets != null) {
      final ticket = event.tickets!.firstWhere(
        (t) => t['id'] == widget.ticketId,
        orElse: () => null,
      );
      setState(() {
        _event = event;
        _ticket = ticket;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  Future<void> _confirmBooking() async {
    setState(() => _booking = true);
    final booking = await context.read<BookingsProvider>().createBooking(
      widget.eventId,
      widget.ticketId,
      _quantity,
    );
    if (mounted) {
      setState(() => _booking = false);
      if (booking != null) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Booking Confirmed!'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, size: 64, color: Colors.green.shade400),
                const SizedBox(height: 12),
                Text('Booking #${booking.bookingNumber}'),
                const SizedBox(height: 4),
                Text('Total: \$${booking.totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/tickets');
                },
                child: const Text('View My Tickets'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking failed'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_event == null || _ticket == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Ticket not found')));
    }

    final price = double.tryParse(_ticket!['price']?.toString() ?? '0') ?? 0;
    final available = (_ticket!['availableQuantity'] ?? 0) as int;
    final subtotal = price * _quantity;
    final serviceFee = subtotal * 0.05;
    final total = subtotal + serviceFee;

    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Booking')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event info
            Text(_event!.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_ticket!['name'] ?? 'Ticket',
                style: TextStyle(color: Colors.grey.shade600)),
            const Divider(height: 32),

            // Quantity
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Quantity', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                Row(
                  children: [
                    IconButton(
                      onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    Text('$_quantity', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                      onPressed: _quantity < available ? () => setState(() => _quantity++) : null,
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                  ],
                ),
              ],
            ),
            Text('$available tickets available', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
            const Divider(height: 32),

            // Price breakdown
            _PriceRow(label: 'Subtotal', value: '\$${subtotal.toStringAsFixed(2)}'),
            const SizedBox(height: 8),
            _PriceRow(label: 'Service Fee (5%)', value: '\$${serviceFee.toStringAsFixed(2)}'),
            const Divider(height: 24),
            _PriceRow(label: 'Total', value: '\$${total.toStringAsFixed(2)}', bold: true),

            const Spacer(),

            // Book button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _booking ? null : _confirmBooking,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _booking
                    ? const SizedBox(height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Pay \$${total.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  const _PriceRow({required this.label, required this.value, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(
          fontSize: bold ? 16 : 14,
          fontWeight: bold ? FontWeight.bold : FontWeight.normal,
          color: bold ? null : Colors.grey.shade600,
        )),
        Text(value, style: TextStyle(
          fontSize: bold ? 18 : 14,
          fontWeight: bold ? FontWeight.bold : FontWeight.w500,
        )),
      ],
    );
  }
}
