class Booking {
  final String id;
  final String bookingNumber;
  final int quantity;
  final double totalAmount;
  final double serviceFee;
  final String status;
  final bool checkedIn;
  final String? qrCode;
  final DateTime createdAt;
  final Map<String, dynamic>? event;
  final Map<String, dynamic>? ticket;

  Booking({
    required this.id,
    required this.bookingNumber,
    required this.quantity,
    required this.totalAmount,
    required this.serviceFee,
    required this.status,
    required this.checkedIn,
    this.qrCode,
    required this.createdAt,
    this.event,
    this.ticket,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'],
        bookingNumber: json['bookingNumber'] ?? '',
        quantity: json['quantity'] ?? 1,
        totalAmount: double.tryParse(json['totalAmount'].toString()) ?? 0,
        serviceFee: double.tryParse(json['serviceFee'].toString()) ?? 0,
        status: json['status'] ?? 'pending',
        checkedIn: json['checkedIn'] ?? false,
        qrCode: json['qrCode'],
        createdAt: DateTime.parse(json['createdAt']),
        event: json['event'],
        ticket: json['ticket'],
      );
}
