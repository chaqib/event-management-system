import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/events_provider.dart';
import '../../models/event.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchC = TextEditingController();
  String _selectedType = '';

  void _search() {
    context.read<EventsProvider>().fetchEvents(
      search: _searchC.text,
      type: _selectedType,
    );
  }

  @override
  void dispose() {
    _searchC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final eventsProvider = context.watch<EventsProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Search Events')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchC,
              onSubmitted: (_) => _search(),
              decoration: InputDecoration(
                hintText: 'Search events...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchC.clear();
                    _search();
                  },
                ),
              ),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: ['', 'conference', 'concert', 'workshop', 'sports', 'festival', 'exhibition'].map((type) {
                final label = type.isEmpty ? 'All' : type[0].toUpperCase() + type.substring(1);
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(label),
                    selected: _selectedType == type,
                    onSelected: (_) {
                      setState(() => _selectedType = type);
                      _search();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: eventsProvider.loading
                ? const Center(child: CircularProgressIndicator())
                : eventsProvider.events.isEmpty
                    ? const Center(child: Text('No events found'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: eventsProvider.events.length,
                        itemBuilder: (_, i) {
                          final event = eventsProvider.events[i];
                          return _SearchResultCard(event: event);
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final Event event;
  const _SearchResultCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/events/${event.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  image: event.imageUrl != null
                      ? DecorationImage(image: NetworkImage(event.imageUrl!), fit: BoxFit.cover)
                      : null,
                ),
                child: event.imageUrl == null
                    ? Icon(Icons.event, color: Theme.of(context).colorScheme.primary)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(event.type.toUpperCase(),
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary)),
                    ),
                    const SizedBox(height: 6),
                    Text(event.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('${DateFormat('MMM dd').format(event.startDate)} ${event.city != null ? '• ${event.city}' : ''}',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    const SizedBox(height: 2),
                    Text(event.isFree ? 'Free' : 'From \$${event.lowestPrice?.toStringAsFixed(2)}',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
