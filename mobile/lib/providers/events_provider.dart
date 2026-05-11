import 'package:flutter/material.dart';
import '../models/event.dart';
import '../services/api_service.dart';

class EventsProvider extends ChangeNotifier {
  List<Event> _events = [];
  List<Event> _featured = [];
  bool _loading = false;
  final _api = ApiService();

  List<Event> get events => _events;
  List<Event> get featured => _featured;
  bool get loading => _loading;

  Future<void> fetchEvents({String? search, String? type}) async {
    _loading = true;
    notifyListeners();
    try {
      final params = <String, String>{'limit': '20'};
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (type != null && type.isNotEmpty) params['type'] = type;
      final data = await _api.get('/events', queryParams: params);
      _events = (data['events'] as List).map((e) => Event.fromJson(e)).toList();
    } catch (_) {
      // Keep previous state
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> fetchFeatured() async {
    try {
      final data = await _api.get('/events/featured/list');
      _featured = (data as List).map((e) => Event.fromJson(e)).toList();
      notifyListeners();
    } catch (_) {}
  }

  Future<Event?> fetchEventById(String id) async {
    try {
      final data = await _api.get('/events/$id');
      return Event.fromJson(data);
    } catch (_) {
      return null;
    }
  }
}
