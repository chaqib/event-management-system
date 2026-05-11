import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/events_provider.dart';
import '../../models/event.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Event? _event;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    final event = await context.read<EventsProvider>().fetchEventById(widget.eventId);
    if (mounted) setState(() { _event = event; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_event == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Event not found')),
      );
    }

    final event = _event!;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: event.imageUrl != null
                  ? Image.network(event.imageUrl!, fit: BoxFit.cover)
                  : Container(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                      child: Icon(Icons.event, size: 80, color: Theme.of(context).colorScheme.primary),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(event.type.toUpperCase(),
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary)),
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(event.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),

                  // Date
                  _InfoRow(
                    icon: Icons.calendar_today,
                    title: 'Date & Time',
                    subtitle: '${DateFormat('EEEE, MMM dd, yyyy').format(event.startDate)}\n${DateFormat('HH:mm').format(event.startDate)} - ${DateFormat('HH:mm').format(event.endDate)}',
                  ),
                  const SizedBox(height: 12),

                  // Location
                  if (event.venue != null || event.city != null)
                    _InfoRow(
                      icon: Icons.location_on,
                      title: event.venue?['name'] ?? 'Location',
                      subtitle: [event.address, event.city].where((s) => s != null).join(', '),
                    ),
                  const SizedBox(height: 12),

                  // Organizer
                  if (event.organizer != null)
                    _InfoRow(
                      icon: Icons.person,
                      title: 'Organizer',
                      subtitle: '${event.organizer!['firstName']} ${event.organizer!['lastName']}',
                    ),

                  const Divider(height: 32),

                  // Description
                  Text('About', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(event.description ?? 'No description available.',
                      style: TextStyle(height: 1.6, color: Colors.grey.shade700)),

                  const Divider(height: 32),

                  // Tickets
                  Text('Tickets', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (event.tickets == null || event.tickets!.isEmpty)
                    const Text('No tickets available')
                  else
                    ...event.tickets!.map((t) => _TicketOption(
                      ticket: t,
                      onBook: () => context.push('/book/${event.id}/${t['id']}'),
                    )),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  const _InfoRow({required this.icon, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
              if (subtitle != null)
                Text(subtitle!, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            ],
          ),
        ),
      ],
    );
  }
}

class _TicketOption extends StatelessWidget {
  final Map<String, dynamic> ticket;
  final VoidCallback onBook;
  const _TicketOption({required this.ticket, required this.onBook});

  @override
  Widget build(BuildContext context) {
    final price = double.tryParse(ticket['price']?.toString() ?? '0') ?? 0;
    final available = (ticket['availableQuantity'] ?? 0) as int;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(ticket['name'] ?? 'Ticket', style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('$available available', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
              ],
            ),
          ),
          Text(price == 0 ? 'Free' : '\$${price.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: available > 0 ? onBook : null,
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
            child: const Text('Book'),
          ),
        ],
      ),
    );
  }
}
