import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = true;
  final _api = ApiService();

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  AuthProvider() {
    _tryAutoLogin();
  }

  Future<void> _tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token != null) {
      _api.setToken(token);
      try {
        final data = await _api.get('/auth/profile');
        _user = User.fromJson(data);
      } catch (_) {
        await prefs.remove('token');
        _api.setToken(null);
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['accessToken']);
    _api.setToken(data['accessToken']);
    _user = User.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> register(String firstName, String lastName, String email, String password) async {
    final data = await _api.post('/auth/register', {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'password': password,
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['accessToken']);
    _api.setToken(data['accessToken']);
    _user = User.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _api.setToken(null);
    _user = null;
    notifyListeners();
  }
}
