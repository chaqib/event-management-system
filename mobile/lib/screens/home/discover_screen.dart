import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/events_provider.dart';
import '../../models/event.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<EventsProvider>();
    provider.fetchEvents();
    provider.fetchFeatured();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final eventsProvider = context.watch<EventsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hello, ${user?.firstName ?? 'Guest'}!',
                style: const TextStyle(fontSize: 14, color: Colors.grey)),
            const Text('Discover Events',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await eventsProvider.fetchEvents();
          await eventsProvider.fetchFeatured();
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // Category chips
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _CategoryChip(label: 'All', selected: true, onTap: () => eventsProvider.fetchEvents()),
                  _CategoryChip(label: 'Conference', onTap: () => eventsProvider.fetchEvents(type: 'conference')),
                  _CategoryChip(label: 'Concert', onTap: () => eventsProvider.fetchEvents(type: 'concert')),
                  _CategoryChip(label: 'Workshop', onTap: () => eventsProvider.fetchEvents(type: 'workshop')),
                  _CategoryChip(label: 'Sports', onTap: () => eventsProvider.fetchEvents(type: 'sports')),
                  _CategoryChip(label: 'Festival', onTap: () => eventsProvider.fetchEvents(type: 'festival')),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Featured
            if (eventsProvider.featured.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('Featured Events',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 220,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: eventsProvider.featured.length,
                  itemBuilder: (_, i) => _FeaturedCard(event: eventsProvider.featured[i]),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // All events
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Upcoming Events',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),
            if (eventsProvider.loading)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
            else if (eventsProvider.events.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No events found')))
            else
              ...eventsProvider.events.map((e) => _EventListItem(event: e)),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, this.selected = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        backgroundColor: Colors.grey.shade100,
        selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.15),
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final Event event;
  const _FeaturedCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        width: 280,
        margin: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 130,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                image: event.imageUrl != null
                    ? DecorationImage(image: NetworkImage(event.imageUrl!), fit: BoxFit.cover)
                    : null,
              ),
              child: event.imageUrl == null
                  ? Center(child: Icon(Icons.event, size: 48, color: Theme.of(context).colorScheme.primary))
                  : null,
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Row(children: [
                    Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(DateFormat('MMM dd, yyyy').format(event.startDate),
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    const Spacer(),
                    Text(event.isFree ? 'Free' : '\$${event.lowestPrice?.toStringAsFixed(0)}+',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventListItem extends StatelessWidget {
  final Event event;
  const _EventListItem({required this.event});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                image: event.imageUrl != null
                    ? DecorationImage(image: NetworkImage(event.imageUrl!), fit: BoxFit.cover)
                    : null,
              ),
              child: event.imageUrl == null
                  ? Center(child: Icon(Icons.event, color: Theme.of(context).colorScheme.primary))
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Row(children: [
                    Icon(Icons.calendar_today, size: 12, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Text(DateFormat('MMM dd').format(event.startDate),
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                    const SizedBox(width: 12),
                    if (event.city != null) ...[
                      Icon(Icons.location_on, size: 12, color: Colors.grey.shade500),
                      const SizedBox(width: 2),
                      Text(event.city!, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                    ],
                  ]),
                  const SizedBox(height: 4),
                  Text(
                    event.isFree ? 'Free' : 'From \$${event.lowestPrice?.toStringAsFixed(2)}',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }
}
