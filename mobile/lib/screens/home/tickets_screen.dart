import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/bookings_provider.dart';
import '../../models/booking.dart';

class TicketsScreen extends StatefulWidget {
  const TicketsScreen({super.key});

  @override
  State<TicketsScreen> createState() => _TicketsScreenState();
}

class _TicketsScreenState extends State<TicketsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabC;

  @override
  void initState() {
    super.initState();
    _tabC = TabController(length: 3, vsync: this);
    context.read<BookingsProvider>().fetchBookings();
  }

  @override
  void dispose() {
    _tabC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookingsProvider>();

    final upcoming = provider.bookings.where((b) => b.status == 'confirmed' && !b.checkedIn).toList();
    final past = provider.bookings.where((b) => b.checkedIn || b.status == 'completed').toList();
    final cancelled = provider.bookings.where((b) => b.status == 'cancelled').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets'),
        bottom: TabBar(
          controller: _tabC,
          tabs: [
            Tab(text: 'Upcoming (${upcoming.length})'),
            Tab(text: 'Past (${past.length})'),
            Tab(text: 'Cancelled (${cancelled.length})'),
          ],
        ),
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabC,
              children: [
                _BookingList(bookings: upcoming, emptyMsg: 'No upcoming tickets'),
                _BookingList(bookings: past, emptyMsg: 'No past tickets'),
                _BookingList(bookings: cancelled, emptyMsg: 'No cancelled tickets'),
              ],
            ),
    );
  }
}

class _BookingList extends StatelessWidget {
  final List<Booking> bookings;
  final String emptyMsg;
  const _BookingList({required this.bookings, required this.emptyMsg});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.confirmation_num_outlined, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text(emptyMsg, style: TextStyle(color: Colors.grey.shade500)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      itemBuilder: (_, i) => _TicketCard(booking: bookings[i]),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final Booking booking;
  const _TicketCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final eventTitle = booking.event?['title'] ?? 'Event';
    final startDate = booking.event?['startDate'] != null
        ? DateFormat('MMM dd, yyyy • HH:mm').format(DateTime.parse(booking.event!['startDate']))
        : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(eventTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor(booking.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(booking.status.toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _statusColor(booking.status))),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(children: [
              Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade500),
              const SizedBox(width: 4),
              Text(startDate, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            ]),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Booking: ${booking.bookingNumber}',
                    style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.grey.shade600)),
                Text('\$${booking.totalAmount.toStringAsFixed(2)}',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
              ],
            ),
            Text('Qty: ${booking.quantity}', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed': return Colors.green;
      case 'pending': return Colors.orange;
      case 'cancelled': return Colors.red;
      case 'completed': return Colors.blue;
      default: return Colors.grey;
    }
  }
}
