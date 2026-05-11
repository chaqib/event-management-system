import 'package:flutter/material.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class BookingsProvider extends ChangeNotifier {
  List<Booking> _bookings = [];
  bool _loading = false;
  final _api = ApiService();

  List<Booking> get bookings => _bookings;
  bool get loading => _loading;

  Future<void> fetchBookings() async {
    _loading = true;
    notifyListeners();
    try {
      final data = await _api.get('/bookings/my');
      _bookings = (data as List).map((b) => Booking.fromJson(b)).toList();
    } catch (_) {}
    _loading = false;
    notifyListeners();
  }

  Future<Booking?> createBooking(String eventId, String ticketId, int quantity) async {
    try {
      final data = await _api.post('/bookings', {
        'eventId': eventId,
        'ticketId': ticketId,
        'quantity': quantity,
      });
      final booking = Booking.fromJson(data);
      _bookings.insert(0, booking);
      notifyListeners();
      return booking;
    } catch (_) {
      return null;
    }
  }

  Future<bool> cancelBooking(String id) async {
    try {
      await _api.patch('/bookings/$id/cancel', {});
      await fetchBookings();
      return true;
    } catch (_) {
      return false;
    }
  }
}
