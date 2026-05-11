class Event {
  final String id;
  final String title;
  final String? description;
  final String? slug;
  final String type;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final String? imageUrl;
  final String? city;
  final String? address;
  final double? latitude;
  final double? longitude;
  final bool isFeatured;
  final int viewCount;
  final Map<String, dynamic>? organizer;
  final Map<String, dynamic>? venue;
  final List<dynamic>? tickets;

  Event({
    required this.id,
    required this.title,
    this.description,
    this.slug,
    required this.type,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.imageUrl,
    this.city,
    this.address,
    this.latitude,
    this.longitude,
    this.isFeatured = false,
    this.viewCount = 0,
    this.organizer,
    this.venue,
    this.tickets,
  });

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['id'],
        title: json['title'] ?? '',
        description: json['description'],
        slug: json['slug'],
        type: json['type'] ?? 'conference',
        status: json['status'] ?? 'draft',
        startDate: DateTime.parse(json['startDate']),
        endDate: DateTime.parse(json['endDate']),
        imageUrl: json['imageUrl'],
        city: json['city'],
        address: json['address'],
        latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
        longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
        isFeatured: json['isFeatured'] ?? false,
        viewCount: json['viewCount'] ?? 0,
        organizer: json['organizer'],
        venue: json['venue'],
        tickets: json['tickets'],
      );

  double? get lowestPrice {
    if (tickets == null || tickets!.isEmpty) return null;
    final prices = tickets!
        .where((t) => t['price'] != null)
        .map((t) => double.tryParse(t['price'].toString()) ?? 0.0)
        .toList();
    if (prices.isEmpty) return null;
    prices.sort();
    return prices.first;
  }

  bool get isFree => lowestPrice == null || lowestPrice == 0;
}
