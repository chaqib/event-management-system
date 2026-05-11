class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? phone;
  final String? avatar;
  final String status;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.avatar,
    this.status = 'active',
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        email: json['email'],
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        role: json['role'] ?? 'attendee',
        phone: json['phone'],
        avatar: json['avatar'],
        status: json['status'] ?? 'active',
      );

  String get fullName => '$firstName $lastName';
}
