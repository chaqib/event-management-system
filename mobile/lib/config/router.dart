import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_shell.dart';
import '../screens/home/discover_screen.dart';
import '../screens/home/search_screen.dart';
import '../screens/home/tickets_screen.dart';
import '../screens/home/profile_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/booking/booking_screen.dart';
import '../screens/notifications/notifications_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    ShellRoute(
      builder: (_, __, child) => HomeShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const DiscoverScreen()),
        GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
        GoRoute(path: '/tickets', builder: (_, __) => const TicketsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
    GoRoute(
      path: '/events/:id',
      builder: (_, state) => EventDetailScreen(eventId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/book/:eventId/:ticketId',
      builder: (_, state) => BookingScreen(
        eventId: state.pathParameters['eventId']!,
        ticketId: state.pathParameters['ticketId']!,
      ),
    ),
    GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
  ],
);
