import type { LLDProblemData } from './lldTypes';

export const LLD_PART2: Record<string, LLDProblemData> = {
  // ===========================================================================
  // 7. BOOKMYSHOW (5-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'bookmyshow': {
    slug: 'bookmyshow',
    num: 7,
    title: 'BookMyShow',
    priority: 'Must Know',
    patterns: ['TTL Seat Lock (Concurrency)', 'State Pattern (Seat Status)'],
    concurrencyNote: 'Per-Seat synchronized CAS / Redis SETNX with 10-min TTL',
    analogy:
      'When two users click Seat A2 at the exact same moment, User 1’s request places a 10-minute temporary padlock (LOCKED) on Seat A2. User 2’s request immediately sees the padlock and gets rejected cleanly before reaching the payment gateway. Once User 1’s payment succeeds, Seat A2 turns permanently BOOKED.',
    requirements: [
      'ShowSeat states: AVAILABLE → LOCKED (with owner & TTL) → BOOKED.',
      'Atomic per-seat lock acquisition so two users cannot book the same chair.',
      'Automatic lock expiry if payment is not completed within TTL.'
    ],
    patternExplanations: [
      {
        pattern: 'ShowSeat vs Physical Seat Separation',
        why: 'Allows the same physical chair to be booked independently for the 2 PM, 6 PM, and 9 PM shows.'
      },
      {
        pattern: 'Fine-Grained Per-Seat Lock',
        why: 'Locks only the specific seat being reserved so other users can book other seats in the same theatre concurrently.'
      }
    ],
    edgeCases: [
      {
        title: 'User 1 locks [A1, A2] while User 2 locks [A2, A1] → Deadlock!',
        solution: 'Sort requested seat IDs alphabetically before acquiring locks.'
      }
    ],
    followUps: [
      {
        q: 'How do you handle a celebrity concert where 100,000 users click at once?',
        a: 'Absorb seat holds in Redis using atomic SETNX + EXPIRE 600 before writing confirmed bookings to the relational DB.'
      }
    ],
    archNodes: [
      { id: 'users', label: 'User App', sublabel: 'Select Seat A2', layer: 'client', x: 110, y: 72 },
      { id: 'ctrl', label: 'BookingServer', sublabel: 'bookSeat()', layer: 'controller', x: 345, y: 72 },
      { id: 'lock', label: 'SeatLockQueue', sublabel: 'tryLock(TTL)', layer: 'pattern', x: 460, y: 172 },
      { id: 'pay', label: 'PaymentGateway', sublabel: 'charge & confirm', layer: 'service', x: 645, y: 172 },
      { id: 'db', label: 'ShowSeat DB', sublabel: 'Seats A1..A4', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'users', to: 'ctrl', label: 'HTTP' },
      { from: 'ctrl', to: 'lock', label: 'tryLock' },
      { from: 'lock', to: 'db', label: 'CAS lock' },
      { from: 'lock', to: 'pay', label: 'charge' },
      { from: 'pay', to: 'db', label: 'confirm' }
    ],
    umlClasses: [
      {
        name: 'SeatStatus',
        stereotype: 'enum',
        role: 'Lifecycle state of a ShowSeat.',
        fields: ['AVAILABLE', 'LOCKED', 'BOOKED'],
        methods: []
      },
      {
        name: 'ShowSeat',
        stereotype: 'class',
        role: 'Per-show seat entity with thread-safe tryLock and confirm transitions.',
        fields: ['- id: String', '- status: SeatStatus', '- lockedBy: String'],
        methods: ['+ synchronized tryLock(userId: String): boolean', '+ synchronized confirm(userId: String): void']
      }
    ],
    javaCode: [
      'enum SeatStatus { AVAILABLE, LOCKED, BOOKED }',
      '',
      'class ShowSeat {',
      '    final String id;',
      '    SeatStatus status = SeatStatus.AVAILABLE;',
      '    String lockedBy;',
      '',
      '    synchronized boolean tryLock(String userId) {',
      '        if (status != SeatStatus.AVAILABLE) return false;',
      '        status = SeatStatus.LOCKED;',
      '        lockedBy = userId;',
      '        return true;',
      '    }',
      '    synchronized void confirm(String userId) {',
      '        if (status == SeatStatus.LOCKED && userId.equals(lockedBy)) {',
      '            status = SeatStatus.BOOKED;',
      '        }',
      '    }',
      '}',
      'public class BookingService {',
      '    public boolean bookSeat(ShowSeat seat, String userId) {',
      '        if (!seat.tryLock(userId)) return false; // Conflict!',
      '        // After payment succeeds:',
      '        seat.confirm(userId);',
      '        return true;',
      '    }',
      '}'
    ],
    pythonCode: [
      'from enum import Enum',
      'from threading import Lock',
      '',
      'class SeatStatus(Enum):',
      '    AVAILABLE, LOCKED, BOOKED = "AVAILABLE", "LOCKED", "BOOKED"',
      '',
      'class ShowSeat:',
      '    def __init__(self, seat_id: str):',
      '        self.id = seat_id',
      '        self.status = SeatStatus.AVAILABLE',
      '        self.locked_by = None',
      '        self._lock = Lock()',
      '',
      '    def try_lock(self, user_id: str) -> bool:',
      '        with self._lock:',
      '            if self.status != SeatStatus.AVAILABLE:',
      '                return False',
      '            self.status = SeatStatus.LOCKED',
      '            self.locked_by = user_id',
      '            return True',
      '',
      '    def confirm(self, user_id: str) -> None:',
      '        with self._lock:',
      '            if self.status == SeatStatus.LOCKED and self.locked_by == user_id:',
      '                self.status = SeatStatus.BOOKED'
    ],
    scenarios: [
      {
        id: 'seat-lock-lifecycle',
        label: '1. Complete Flow: Seats Available → User 1 Requests A2 → Atomic Lock → User 2 Blocked → Payment Confirms',
        summary: 'Starts with Seat A2 AVAILABLE and traces User 1 acquiring the lock, User 2 getting blocked, and payment finalizing the booking.',
        steps: [
          {
            title: 'Step 1: Start (Seat A2 AVAILABLE) — User 1 Clicks Seat A2',
            explanation: 'Starting state: Row A seats A1, A2, A3 are all AVAILABLE. User 1 clicks Seat A2 on User App, sending bookSeat(A2, "User1") to BookingServer.',
            status: 'info',
            activeArchNodes: ['users', 'ctrl'],
            activeArchEdge: { from: 'users', to: 'ctrl', call: 'POST /book (Seat A2)' },
            domainGroups: [
              {
                title: 'Screen 1 — Row A Seats (Initial State)',
                layout: 'row',
                cells: [
                  { id: 'a1', label: 'Seat A1', sublabel: 'AVAILABLE', status: 'default' },
                  { id: 'a2', label: 'Seat A2', sublabel: 'AVAILABLE (Clicked)', badge: 'USER 1', status: 'active' },
                  { id: 'a3', label: 'Seat A3', sublabel: 'AVAILABLE', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '1. Request Sent', changed: true },
              { label: 'Seat A2', value: 'AVAILABLE' },
              { label: 'Caller', value: 'User 1' }
            ],
            activeLinesJava: [21],
            activeLinesPy: [14]
          },
          {
            title: 'Step 2: SeatLockQueue Acquires 10-Min TTL Lock on Seat A2 in DB',
            explanation: 'BookingServer calls seat.tryLock("User1"). SeatLockQueue atomically flips Seat A2 in ShowSeat DB from AVAILABLE → LOCKED (owner = User 1).',
            status: 'info',
            activeArchNodes: ['ctrl', 'lock', 'db'],
            activeArchEdge: { from: 'lock', to: 'db', call: 'tryLock(A2, User1)' },
            domainGroups: [
              {
                title: 'Screen 1 — Row A Seats (A2 Locked by User 1)',
                layout: 'row',
                cells: [
                  { id: 'a1', label: 'Seat A1', sublabel: 'AVAILABLE', status: 'default' },
                  { id: 'a2', label: 'Seat A2', sublabel: 'Owner: User 1', badge: '🔒 LOCKED 10m', status: 'locked' },
                  { id: 'a3', label: 'Seat A3', sublabel: 'AVAILABLE', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '2. Atomic Lock', changed: true },
              { label: 'Seat A2', value: 'LOCKED (User 1)', changed: true },
              { label: 'Lock TTL', value: '600s' }
            ],
            activeLinesJava: [8, 9, 10, 11, 12, 22],
            activeLinesPy: [14, 15, 16, 18, 19, 20]
          },
          {
            title: 'Step 3: Concurrent User 2 Requests Seat A2 → Rejected Immediately!',
            explanation: 'While User 1 is paying, User 2 clicks Seat A2. tryLock("User2") sees status == LOCKED != AVAILABLE and returns false (409 Conflict).',
            status: 'warning',
            activeArchNodes: ['users', 'ctrl', 'lock'],
            activeArchEdge: { from: 'ctrl', to: 'lock', call: 'tryLock(User2) → false' },
            domainGroups: [
              {
                title: 'Screen 1 — Row A Seats (User 2 Blocked by Lock)',
                layout: 'row',
                cells: [
                  { id: 'a1', label: 'Seat A1', sublabel: 'AVAILABLE', status: 'default' },
                  { id: 'a2', label: 'Seat A2', sublabel: 'User 2 Blocked!', badge: '🔒 HELD BY U1', status: 'warning' },
                  { id: 'a3', label: 'Seat A3', sublabel: 'AVAILABLE', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '3. Race Prevented', changed: true },
              { label: 'User 2 Req', value: '409 Rejected ✗', changed: true },
              { label: 'Seat A2 Owner', value: 'Still User 1 ✓' }
            ],
            activeLinesJava: [9, 22],
            activeLinesPy: [16, 17]
          },
          {
            title: 'Step 4: PaymentWorker Charges User 1 & Confirms Seat A2 as BOOKED',
            explanation: 'PaymentWorker processes User 1’s payment and calls seat.confirm("User1") on ShowSeat DB, permanently transitioning Seat A2 to BOOKED!',
            status: 'success',
            activeArchNodes: ['lock', 'pay', 'db'],
            activeArchEdge: { from: 'pay', to: 'db', call: 'confirm(A2) → BOOKED' },
            domainGroups: [
              {
                title: 'Screen 1 — Row A Seats (A2 Confirmed Booked)',
                layout: 'row',
                cells: [
                  { id: 'a1', label: 'Seat A1', sublabel: 'AVAILABLE', status: 'default' },
                  { id: 'a2', label: 'Seat A2', sublabel: 'Ticketed to User 1', badge: '✅ BOOKED', status: 'success' },
                  { id: 'a3', label: 'Seat A3', sublabel: 'AVAILABLE', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '4. Booking Confirmed', changed: true },
              { label: 'Seat A2', value: 'BOOKED ✓', changed: true },
              { label: 'Ticket', value: 'Issued to User 1', changed: true }
            ],
            activeLinesJava: [14, 15, 16, 24, 25],
            activeLinesPy: [22, 23, 24, 25]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 8. FOOD DELIVERY (4-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'food-delivery': {
    slug: 'food-delivery',
    num: 8,
    title: 'Food Delivery',
    priority: 'Must Know',
    patterns: ['State Pattern (Order Lifecycle)', 'Strategy (Driver Match)', 'Observer (Alerts)'],
    concurrencyNote: 'Atomic CAS on Rider Availability',
    analogy:
      'When you tap "Place Order," the request flows from your phone to OrderServer → NearestDriverStrategy picks the closest rider → Order transitions PLACED → PREPARING → PICKED_UP → DELIVERED while EventNotifier pushes updates to everyone.',
    requirements: [
      'Order lifecycle states: PLACED → PREPARING → PICKED_UP → DELIVERED.',
      'Pluggable DriverMatchingStrategy.',
      'Observer notifications on every state change.'
    ],
    patternExplanations: [
      {
        pattern: 'Strategy + Observer Combination',
        why: 'Strategy decouples how riders are matched, while Observer decouples who gets notified when order status changes.'
      }
    ],
    edgeCases: [
      {
        title: 'Matched rider declines the delivery ping',
        solution: 'Add rider to excludedIds for that order and re-run DriverMatchingStrategy.'
      }
    ],
    followUps: [
      {
        q: 'How do you find nearby riders fast across a city?',
        a: 'Index live rider coordinates in Uber H3 hexagons or Redis GEO.'
      }
    ],
    archNodes: [
      { id: 'cust', label: 'Customer App', sublabel: 'Checkout Cart', layer: 'client', x: 110, y: 72 },
      { id: 'ord', label: 'OrderServer', sublabel: 'Order #501', layer: 'controller', x: 345, y: 72 },
      { id: 'match', label: 'MatchQueue', sublabel: 'Nearest Rider', layer: 'pattern', x: 460, y: 172 },
      { id: 'obs', label: 'EventNotifier', sublabel: 'notifyObservers()', layer: 'service', x: 645, y: 172 },
      { id: 'actors', label: 'Order & Rider DB', sublabel: 'Status + GPS', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'cust', to: 'ord', label: 'HTTP' },
      { from: 'ord', to: 'match', label: 'findRider' },
      { from: 'match', to: 'obs', label: 'events' },
      { from: 'obs', to: 'actors', label: 'persist' },
      { from: 'ord', to: 'actors', label: 'save' }
    ],
    umlClasses: [
      {
        name: 'DriverMatchingStrategy',
        stereotype: 'interface',
        role: 'Selects best rider from available pool.',
        fields: [],
        methods: ['+ match(order: Order, pool: List<Rider>): Rider']
      },
      {
        name: 'OrderService',
        stereotype: 'class',
        role: 'Coordinates order creation, rider matching, and observer broadcasts.',
        fields: ['- matcher: DriverMatchingStrategy', '- observers: List<OrderObserver>'],
        methods: ['+ assignAndPrepare(order, pool): void', '+ transition(order, next): void']
      }
    ],
    javaCode: [
      'enum OrderStatus { PLACED, PREPARING, PICKED_UP, DELIVERED }',
      '',
      'interface DriverMatchingStrategy {',
      '    Rider match(Order order, List<Rider> pool);',
      '}',
      'interface OrderObserver {',
      '    void onStatusChange(Order order);',
      '}',
      'public class OrderService {',
      '    private final DriverMatchingStrategy matcher;',
      '    private final List<OrderObserver> observers = new ArrayList<>();',
      '',
      '    public void assignAndPrepare(Order order, List<Rider> pool) {',
      '        Rider r = matcher.match(order, pool);',
      '        order.rider = r;',
      '        transition(order, OrderStatus.PREPARING);',
      '    }',
      '    public void transition(Order order, OrderStatus next) {',
      '        order.status = next;',
      '        for (OrderObserver obs : observers) {',
      '            obs.onStatusChange(order);',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      'from enum import Enum',
      '',
      'class OrderStatus(Enum):',
      '    PLACED, PREPARING, PICKED_UP, DELIVERED = 1, 2, 3, 4',
      '',
      'class OrderService:',
      '    def __init__(self, matcher, observers=None):',
      '        self.matcher = matcher',
      '        self.observers = observers or []',
      '',
      '    def assign_and_prepare(self, order, pool):',
      '        order.rider = self.matcher.match(order, pool)',
      '        self.transition(order, OrderStatus.PREPARING)',
      '',
      '    def transition(self, order, next_status: OrderStatus):',
      '        order.status = next_status',
      '        for obs in self.observers:',
      '            obs.on_status_change(order)'
    ],
    scenarios: [
      {
        id: 'full-order-flow',
        label: '1. Complete Flow: Customer Checkout → Create Order → Match Nearest Rider → Notify & Deliver',
        summary: 'Starts from Customer tapping Checkout and follows the request through OrderServer, MatchQueue, Push Workers, and Database.',
        steps: [
          {
            title: 'Step 1: Start — Customer Taps Checkout to Place Order #501',
            explanation: 'We start at the Customer App: user places Order #501. An HTTP request travels from Customer App to OrderServer, creating Order #501 in PLACED state.',
            status: 'info',
            activeArchNodes: ['cust', 'ord'],
            activeArchEdge: { from: 'cust', to: 'ord', call: 'POST /orders (#501)' },
            domainGroups: [
              {
                title: 'Order #501 Lifecycle Pipeline',
                layout: 'chain',
                cells: [
                  { id: 'st1', label: 'PLACED', sublabel: 'Created!', badge: 'STEP 1', status: 'active' },
                  { id: 'st2', label: 'PREPARING', sublabel: 'Pending', status: 'default' },
                  { id: 'st3', label: 'PICKED_UP', sublabel: 'Pending', status: 'default' },
                  { id: 'st4', label: 'DELIVERED', sublabel: 'Pending', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Order #501', value: 'PLACED', changed: true },
              { label: 'Rider', value: 'Unassigned' },
              { label: 'Notifications', value: '0 Sent' }
            ],
            activeLinesJava: [13],
            activeLinesPy: [11]
          },
          {
            title: 'Step 2: OrderServer Queries MatchQueue (Nearest Rider = Ravi at 0.8 km)',
            explanation: 'OrderServer invokes matcher.match(order, pool). MatchQueue evaluates GPS distances (Ravi 0.8 km vs Aman 3.4 km) and assigns Rider Ravi!',
            status: 'info',
            activeArchNodes: ['ord', 'match'],
            activeArchEdge: { from: 'ord', to: 'match', call: 'match() → Ravi (0.8km)' },
            domainGroups: [
              {
                title: 'Order #501 Lifecycle & Rider Pool',
                layout: 'chain',
                cells: [
                  { id: 'st1', label: 'PLACED', status: 'muted' },
                  { id: 'st2', label: 'PREPARING', sublabel: 'Rider: Ravi (0.8km)', badge: 'MATCHED ✓', status: 'active' },
                  { id: 'st3', label: 'PICKED_UP', status: 'default' },
                  { id: 'st4', label: 'DELIVERED', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Order #501', value: 'PREPARING', changed: true },
              { label: 'Rider', value: 'Ravi (0.8 km)', changed: true },
              { label: 'Strategy', value: 'NearestDriver' }
            ],
            activeLinesJava: [14, 15, 16],
            activeLinesPy: [12, 13]
          },
          {
            title: 'Step 3: Push Workers Broadcast Status Event & Persist to DB',
            explanation: 'As the order moves through PICKED_UP → DELIVERED, Push Workers fan out onStatusChange() alerts to the Customer, Restaurant, and Rider DB!',
            status: 'success',
            activeArchNodes: ['match', 'obs', 'actors'],
            activeArchEdge: { from: 'obs', to: 'actors', call: 'onStatusChange(DELIVERED)' },
            domainGroups: [
              {
                title: 'Order #501 Lifecycle Pipeline',
                layout: 'chain',
                cells: [
                  { id: 'st1', label: 'PLACED', status: 'muted' },
                  { id: 'st2', label: 'PREPARING', status: 'muted' },
                  { id: 'st3', label: 'PICKED_UP', status: 'muted' },
                  { id: 'st4', label: 'DELIVERED', sublabel: 'All Observers Alerted', badge: '✅ COMPLETE', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Order #501', value: 'DELIVERED ✓', changed: true },
              { label: 'Rider', value: 'Ravi (Completed)' },
              { label: 'Notifications', value: 'Push + SMS Sent ✓', changed: true }
            ],
            activeLinesJava: [18, 19, 20, 21],
            activeLinesPy: [15, 16, 17, 18]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 9. RATE LIMITER (5-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'rate-limiter': {
    slug: 'rate-limiter',
    num: 9,
    title: 'Rate Limiter',
    priority: 'Must Know',
    patterns: ['Strategy Pattern (Token Bucket)', 'Lazy O(1) Token Refill'],
    concurrencyNote: 'Per-User Lock or Single Atomic Redis Lua Script',
    analogy:
      'Your user account has a bucket that holds 2 tokens max and refills 1 token per second. Each request takes 1 token as it passes through the API Gateway. When the bucket hits 0, incoming requests are dropped with 429 Too Many Requests until 1 second elapses.',
    requirements: [
      'TokenBucketLimiter with configurable capacity and refillPerSec.',
      'Lazy O(1) token refill computed on request arrival.',
      'Return true (200 OK) when tokens >= 1, false (429) when empty.'
    ],
    patternExplanations: [
      {
        pattern: 'Lazy Refill on Request Arrival',
        why: 'Computes elapsed * refillPerSec on the fly during allowRequest(), avoiding background timer threads for millions of buckets.'
      }
    ],
    edgeCases: [
      {
        title: 'Long idle period (e.g., user sends no requests for 1 hour)',
        solution: 'Clamp refilled tokens with Math.min(capacity, tokens + elapsed * rate) so tokens never exceed capacity.'
      }
    ],
    followUps: [
      {
        q: 'How do you run Token Bucket across 50 distributed API Gateway nodes?',
        a: 'Store (tokens, lastRefillSec) in Redis and execute refill + decrement inside one atomic Redis Lua script.'
      }
    ],
    archNodes: [
      { id: 'req', label: 'API Client', sublabel: 'User_42', layer: 'client', x: 110, y: 72 },
      { id: 'gw', label: 'API Gateway', sublabel: 'RateLimitFilter', layer: 'controller', x: 345, y: 72 },
      { id: 'strat', label: 'TokenBucket', sublabel: 'Cap=2, +1/sec', layer: 'pattern', x: 460, y: 172 },
      { id: 'svc', label: 'Backend Service', sublabel: 'process order', layer: 'service', x: 645, y: 172 },
      { id: 'store', label: 'Redis Bucket DB', sublabel: 'tokens, lastTs', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'req', to: 'gw', label: 'HTTP' },
      { from: 'gw', to: 'strat', label: 'allow?' },
      { from: 'strat', to: 'store', label: 'Lua CAS' },
      { from: 'strat', to: 'svc', label: 'forward' },
      { from: 'svc', to: 'store', label: 'query' }
    ],
    umlClasses: [
      {
        name: 'RateLimiter',
        stereotype: 'interface',
        role: 'Pluggable rate limiting strategy interface.',
        fields: [],
        methods: ['+ allowRequest(userId: String, nowSec: long): boolean']
      },
      {
        name: 'TokenBucketLimiter',
        stereotype: 'strategy',
        role: 'Implements lazy token refill and atomic consumption.',
        fields: ['- capacity: int', '- refillPerSec: int', '- tokens: double', '- lastRefillSec: long'],
        methods: ['+ synchronized allowRequest(userId, nowSec): boolean']
      }
    ],
    javaCode: [
      'interface RateLimiter { boolean allowRequest(String userId, long nowSec); }',
      '',
      'public class TokenBucketLimiter implements RateLimiter {',
      '    private final int capacity;',
      '    private final int refillPerSec;',
      '    private double tokens;',
      '    private long lastRefillSec;',
      '',
      '    public TokenBucketLimiter(int cap, int rate) {',
      '        this.capacity = cap; this.refillPerSec = rate;',
      '        this.tokens = cap; this.lastRefillSec = 0;',
      '    }',
      '    public synchronized boolean allowRequest(String userId, long nowSec) {',
      '        long elapsed = Math.max(0, nowSec - lastRefillSec);',
      '        tokens = Math.min(capacity, tokens + elapsed * refillPerSec);',
      '        lastRefillSec = nowSec;',
      '        if (tokens >= 1.0) {',
      '            tokens -= 1.0;',
      '            return true;  // 200 OK',
      '        }',
      '        return false;     // 429 Too Many Requests',
      '    }',
      '}'
    ],
    pythonCode: [
      'from threading import Lock',
      '',
      'class TokenBucketLimiter:',
      '    def __init__(self, capacity: int, refill_per_sec: int):',
      '        self.capacity = capacity',
      '        self.refill_per_sec = refill_per_sec',
      '        self.tokens = float(capacity)',
      '        self.last_refill_sec = 0',
      '        self._lock = Lock()',
      '',
      '    def allow_request(self, user_id: str, now_sec: int) -> bool:',
      '        with self._lock:',
      '            elapsed = max(0, now_sec - self.last_refill_sec)',
      '            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_per_sec)',
      '            self.last_refill_sec = now_sec',
      '            if self.tokens >= 1.0:',
      '                self.tokens -= 1.0',
      '                return True   # 200 OK',
      '            return False      # 429 Too Many Requests'
    ],
    scenarios: [
      {
        id: 'full-rate-limit-trace',
        label: '1. Complete Flow: Full Bucket (2/2) → Burst Consume → Empty Bucket 429 Block → Lazy Refill Pass',
        summary: 'Starts from a full 2-token bucket at t=0s and traces requests being allowed, throttled with 429, and allowed again after lazy refill.',
        steps: [
          {
            title: 'Step 1: Start (t = 0s, Bucket Full 2/2) — Client Sends Request #1',
            explanation: 'Starting state: User_42’s bucket in Redis starts full with 2 / 2 tokens. API Client sends GET /orders (Req #1) to API Gateway.',
            status: 'info',
            activeArchNodes: ['req', 'gw', 'strat'],
            activeArchEdge: { from: 'req', to: 'gw', call: 'GET /orders (Req #1)' },
            domainGroups: [
              {
                title: 'User_42 Token Bucket (Capacity = 2, Refill = +1 token/sec)',
                layout: 'row',
                cells: [
                  { id: 'tk1', label: 'Token 1 🪙', sublabel: 'Available', badge: 'FULL', status: 'success' },
                  { id: 'tk2', label: 'Token 2 🪙', sublabel: 'Available', badge: 'FULL', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Clock', value: 't = 0s' },
              { label: 'Bucket Tokens', value: '2 / 2 (Full)' },
              { label: 'Incoming', value: 'Req #1', changed: true }
            ],
            activeLinesJava: [9, 10, 11, 13],
            activeLinesPy: [4, 5, 7, 11]
          },
          {
            title: 'Step 2: Burst Requests #1 & #2 Consume Both Tokens → Forwarded to App Workers',
            explanation: 'TokenBucket decrements tokens 2 → 1 → 0 in Redis Bucket DB and forwards both requests to App Workers (200 OK). Bucket is now empty (0/2)!',
            status: 'success',
            activeArchNodes: ['gw', 'strat', 'store', 'svc'],
            activeArchEdge: { from: 'strat', to: 'svc', call: 'tokens -= 2 → 200 OK' },
            domainGroups: [
              {
                title: 'User_42 Token Bucket (0 / 2 Tokens Remaining)',
                layout: 'row',
                cells: [
                  { id: 'tk1', label: 'Token 1', sublabel: 'Used by Req #1', badge: '200 OK', status: 'muted' },
                  { id: 'tk2', label: 'Token 2', sublabel: 'Used by Req #2', badge: '200 OK', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Clock', value: 't = 0s' },
              { label: 'Bucket Tokens', value: '0 / 2 (Empty)', changed: true },
              { label: 'Req #1 & #2', value: '200 OK ✓', changed: true }
            ],
            activeLinesJava: [17, 18, 19],
            activeLinesPy: [16, 17, 18]
          },
          {
            title: 'Step 3: Request #3 Arrives at t = 0s → Bucket Empty → Dropped with 429!',
            explanation: 'Request #3 arrives at t=0s (elapsed = 0s, refill = 0). Since tokens (0) < 1, TokenBucket blocks the request at API Gateway—App Workers are protected!',
            status: 'error',
            activeArchNodes: ['req', 'gw', 'strat'],
            activeArchEdge: { from: 'gw', to: 'strat', call: 'tokens == 0 → 429!' },
            domainGroups: [
              {
                title: 'User_42 Token Bucket (Throttling Active)',
                layout: 'row',
                cells: [
                  { id: 'tk1', label: 'Slot 1 Empty', sublabel: 'Wait 1s for refill', badge: '429 BLOCKED', status: 'danger' },
                  { id: 'tk2', label: 'Slot 2 Empty', sublabel: 'Wait 1s for refill', badge: '429 BLOCKED', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'Clock', value: 't = 0s' },
              { label: 'Bucket Tokens', value: '0 / 2' },
              { label: 'Req #3 Result', value: '429 Too Many Req ✗', changed: true }
            ],
            activeLinesJava: [14, 15, 17, 21],
            activeLinesPy: [13, 14, 16, 19]
          },
          {
            title: 'Step 4: Request #4 Arrives at t = 1s → Lazy Refill (+1 Token) → 200 OK!',
            explanation: 'At t=1s, elapsed = 1s - 0s = 1s. Lazy refill adds 1 token in Redis Bucket DB, Request #4 consumes it immediately, and passes through to App Workers!',
            status: 'success',
            activeArchNodes: ['gw', 'strat', 'store', 'svc'],
            activeArchEdge: { from: 'strat', to: 'store', call: 'refill(+1) → 200 OK' },
            domainGroups: [
              {
                title: 'User_42 Token Bucket (Lazy Refill at t = 1s)',
                layout: 'row',
                cells: [
                  { id: 'tk1', label: 'Token 1 🪙', sublabel: 'Refilled & Used by #4', badge: '200 OK ✓', status: 'success' },
                  { id: 'tk2', label: 'Slot 2 Empty', sublabel: '0 left', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Clock', value: 't = 1s (+1s)', changed: true },
              { label: 'Lazy Refill', value: '+1 Token Consumed', changed: true },
              { label: 'Req #4 Result', value: '200 OK ✓', changed: true }
            ],
            activeLinesJava: [14, 15, 16, 17, 18, 19],
            activeLinesPy: [13, 14, 15, 16, 17, 18]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 10. MEETING SCHEDULER (4-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'meeting-scheduler': {
    slug: 'meeting-scheduler',
    num: 10,
    title: 'Meeting Scheduler',
    priority: 'Important',
    patterns: ['TreeMap Interval Overlap Check', 'Observer (Calendar Invites)'],
    concurrencyNote: 'Per-Room ReentrantLock on Calendar TreeMap',
    analogy:
      'When you book a 10:00–11:00 meeting for 6 people, the scheduler checks each room with capacity >= 6. If Room A already has a 09:30–10:30 meeting (overlap!), it skips Room A, locks Room B (whose 11:00–12:00 meeting only touches at 11:00), saves the interval, and emails invites.',
    requirements: [
      'Filter rooms by capacity >= attendee headcount.',
      'O(log M) interval overlap detection using TreeMap floorKey/ceilingKey.',
      'Allow back-to-back meetings that touch at endpoints (e.g., 10–11 and 11–12).',
      'Send invites to participants after booking.'
    ],
    patternExplanations: [
      {
        pattern: 'TreeMap<StartTime, EndTime> Interval Check',
        why: 'Checks adjacent intervals in O(log M) instead of scanning all historical meetings.'
      }
    ],
    edgeCases: [
      {
        title: 'Touching endpoints: [10:00, 11:00) and [11:00, 12:00)',
        solution: 'Strict inequalities (prevEnd > start and nextStart < end) allow back-to-back bookings.'
      }
    ],
    followUps: [
      {
        q: 'How do you prevent double booking of the same room?',
        a: 'Guard MeetingRoom.tryBook(start, end) with a per-room lock or DB exclusion constraint.'
      }
    ],
    archNodes: [
      { id: 'org', label: 'Organizer', sublabel: '10:00–11:00 (6p)', layer: 'client', x: 110, y: 72 },
      { id: 'sched', label: 'SchedulerServer', sublabel: 'book()', layer: 'controller', x: 345, y: 72 },
      { id: 'cal', label: 'OverlapEngine', sublabel: 'TreeMap Check', layer: 'pattern', x: 460, y: 172 },
      { id: 'notif', label: 'InviteService', sublabel: 'sendInvites()', layer: 'service', x: 645, y: 172 },
      { id: 'rooms', label: 'Calendar DB', sublabel: 'Room A & Room B', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'org', to: 'sched', label: 'HTTP' },
      { from: 'sched', to: 'cal', label: 'tryBook' },
      { from: 'cal', to: 'rooms', label: 'insert' },
      { from: 'cal', to: 'notif', label: 'notify' },
      { from: 'notif', to: 'rooms', label: 'log' }
    ],
    umlClasses: [
      {
        name: 'MeetingRoom',
        stereotype: 'class',
        role: 'Stores room capacity and sorted TreeMap of booked [start, end) intervals.',
        fields: ['- name: String', '- capacity: int', '- cal: TreeMap<Integer, Integer>'],
        methods: ['+ synchronized tryBook(start: int, end: int): boolean']
      },
      {
        name: 'MeetingScheduler',
        stereotype: 'class',
        role: 'Iterates candidate rooms and books the first conflict-free room.',
        fields: [],
        methods: ['+ book(rooms, start, end, people): String']
      }
    ],
    javaCode: [
      'class MeetingRoom {',
      '    final String name; final int capacity;',
      '    private final TreeMap<Integer, Integer> cal = new TreeMap<>();',
      '',
      '    synchronized boolean tryBook(int start, int end) {',
      '        Integer prevStart = cal.floorKey(start);',
      '        if (prevStart != null && cal.get(prevStart) > start) return false;',
      '        Integer nextStart = cal.ceilingKey(start);',
      '        if (nextStart != null && nextStart < end) return false;',
      '        cal.put(start, end);',
      '        return true;',
      '    }',
      '}',
      'public class MeetingScheduler {',
      '    public String book(List<MeetingRoom> rooms, int start, int end, int people) {',
      '        for (MeetingRoom r : rooms) {',
      '            if (r.capacity >= people && r.tryBook(start, end)) {',
      '                return r.name;',
      '            }',
      '        }',
      '        throw new IllegalStateException("No room available");',
      '    }',
      '}'
    ],
    pythonCode: [
      'class MeetingRoom:',
      '    def __init__(self, name: str, capacity: int):',
      '        self.name = name',
      '        self.capacity = capacity',
      '        self.intervals: list[tuple[int, int]] = []',
      '',
      '    def try_book(self, start: int, end: int) -> bool:',
      '        for s, e in self.intervals:',
      '            if s < end and start < e:  # Overlap!',
      '                return False',
      '        self.intervals.append((start, end))',
      '        return True',
      '',
      'class MeetingScheduler:',
      '    def book(self, rooms, start: int, end: int, people: int) -> str:',
      '        for r in rooms:',
      '            if r.capacity >= people and r.try_book(start, end):',
      '                return r.name',
      '        raise RuntimeError("No room available")'
    ],
    scenarios: [
      {
        id: 'full-scheduler-trace',
        label: '1. Complete Flow: Request 10:00–11:00 → Room A Conflict → Room B Booked → Invites Sent',
        summary: 'Traces a booking request from Organizer through Room A overlap rejection, Room B boundary check, DB save, and invite dispatch.',
        steps: [
          {
            title: 'Step 1: Start — Organizer Requests [10:00, 11:00) for 6 People',
            explanation: 'Organizer clicks "Schedule Meeting" for 10:00–11:00 (6 attendees). Request arrives at SchedulerServer.',
            status: 'info',
            activeArchNodes: ['org', 'sched'],
            activeArchEdge: { from: 'org', to: 'sched', call: 'book(10:00, 11:00, 6p)' },
            domainGroups: [
              {
                title: 'Room Calendars (Initial State)',
                layout: 'row',
                cells: [
                  { id: 'ra', label: 'Room A (Cap 8)', sublabel: 'Booked: 09:30–10:30', status: 'default' },
                  { id: 'rb', label: 'Room B (Cap 6)', sublabel: 'Booked: 11:00–12:00', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: '10:00–11:00 (6p)', changed: true },
              { label: 'Candidate 1', value: 'Room A (Cap 8)' },
              { label: 'Candidate 2', value: 'Room B (Cap 6)' }
            ],
            activeLinesJava: [15, 16],
            activeLinesPy: [15, 16]
          },
          {
            title: 'Step 2: OverlapEngine Checks Room A → Conflict with [09:30, 10:30)!',
            explanation: 'OverlapEngine checks Room A: floorKey(10:00) is 09:30, which ends at 10:30 > 10:00. Overlap detected—Room A returns false!',
            status: 'warning',
            activeArchNodes: ['sched', 'cal'],
            activeArchEdge: { from: 'sched', to: 'cal', call: 'RoomA.tryBook() → false' },
            domainGroups: [
              {
                title: 'Room Calendars (Room A Rejected)',
                layout: 'row',
                cells: [
                  { id: 'ra', label: 'Room A (Cap 8)', sublabel: '09:30–10:30 overlaps 10:00', badge: 'CONFLICT ✗', status: 'danger' },
                  { id: 'rb', label: 'Room B (Cap 6)', sublabel: 'Next candidate...', badge: 'CHECKING', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'Room A Check', value: '10:30 > 10:00 (Overlap)', changed: true },
              { label: 'Room A Result', value: 'Skipped ✗', changed: true },
              { label: 'Next Up', value: 'Room B' }
            ],
            activeLinesJava: [5, 6, 7, 17],
            activeLinesPy: [7, 8, 9, 10, 17]
          },
          {
            title: 'Step 3: OverlapEngine Checks Room B → Back-to-Back [11:00, 12:00) Valid → Saved!',
            explanation: 'Room B’s existing meeting starts at 11:00 (not < 11:00). OverlapEngine inserts [10:00, 11:00) into Calendar DB and triggers InviteWorkers!',
            status: 'success',
            activeArchNodes: ['cal', 'rooms', 'notif'],
            activeArchEdge: { from: 'cal', to: 'rooms', call: 'cal.put(10:00, 11:00)' },
            domainGroups: [
              {
                title: 'Room Calendars (Room B Booked)',
                layout: 'row',
                cells: [
                  { id: 'ra', label: 'Room A (Cap 8)', sublabel: 'Busy 09:30–10:30', status: 'muted' },
                  { id: 'rb', label: 'Room B (Cap 6)', sublabel: 'Booked 10:00–11:00 + 11:00–12:00', badge: '✅ BOOKED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Assigned Room', value: 'Room B ✓', changed: true },
              { label: '11:00 Boundary', value: 'Back-to-Back OK', changed: true },
              { label: 'Calendar Invites', value: '6 Dispatched ✓', changed: true }
            ],
            activeLinesJava: [8, 9, 10, 11, 18],
            activeLinesPy: [11, 12, 18]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 11. ELEVATOR (5-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'elevator': {
    slug: 'elevator',
    num: 11,
    title: 'Elevator',
    priority: 'Must Know',
    patterns: ['LOOK Two-Heap Algorithm (MinHeap UP + MaxHeap DOWN)', 'State Pattern'],
    concurrencyNote: 'Synchronized Heap Offer + Event-Driven Elevator Loop',
    analogy:
      'An elevator never zig-zags wildly! It uses a Min-Heap (upStops) to serve all upward requests in sorted order (3 → 5 → 7) in one smooth sweep, and a Max-Heap (downStops) to serve downward requests (4 → 2) only after finishing its upward sweep.',
    requirements: [
      'Maintain upStops (Min-Heap) and downStops (Max-Heap) per ElevatorCar.',
      'Route floor >= currentFloor to upStops and floor < currentFloor to downStops.',
      'Serve all stops in current direction before reversing direction (LOOK algorithm).'
    ],
    patternExplanations: [
      {
        pattern: 'Two-Heap LOOK Scheduling',
        why: 'Gives O(log F) insertion and guarantees optimal directional sweeps without starvation.'
      }
    ],
    edgeCases: [
      {
        title: 'Downward request arrives while elevator is moving UP',
        solution: 'Hold it in downStops Max-Heap until upStops is completely empty.'
      }
    ],
    followUps: [
      {
        q: 'Why LOOK instead of SCAN?',
        a: 'LOOK reverses as soon as the highest requested floor (e.g. Floor 7) is served instead of travelling unnecessarily to the roof (Floor 8).'
      }
    ],
    archNodes: [
      { id: 'btn', label: 'Hall Buttons', sublabel: 'Press F7 & F2', layer: 'client', x: 110, y: 72 },
      { id: 'disp', label: 'ElevatorServer', sublabel: 'addStop / step', layer: 'controller', x: 345, y: 72 },
      { id: 'up', label: 'UpHeap Queue', sublabel: 'Min-Heap ↑', layer: 'pattern', x: 460, y: 172 },
      { id: 'down', label: 'DownWorkers', sublabel: 'Max-Heap ↓', layer: 'service', x: 645, y: 172 },
      { id: 'car', label: 'Shaft State DB', sublabel: 'Floors F1..F8', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'btn', to: 'disp', label: 'press' },
      { from: 'disp', to: 'up', label: 'floor >= curr' },
      { from: 'disp', to: 'car', label: 'move UP' },
      { from: 'up', to: 'down', label: 'flip dir' },
      { from: 'down', to: 'car', label: 'move DOWN' }
    ],
    umlClasses: [
      {
        name: 'ElevatorCar',
        stereotype: 'class',
        role: 'Executes LOOK scheduling with upStops Min-Heap and downStops Max-Heap.',
        fields: ['- currentFloor: int', '- dir: Direction', '- upStops: PriorityQueue<Integer>', '- downStops: PriorityQueue<Integer>'],
        methods: ['+ addStop(floor: int): void', '+ step(): void']
      }
    ],
    javaCode: [
      'enum Direction { UP, DOWN, IDLE }',
      '',
      'public class ElevatorCar {',
      '    int currentFloor = 3;',
      '    Direction dir = Direction.UP;',
      '    final PriorityQueue<Integer> upStops = new PriorityQueue<>();',
      '    final PriorityQueue<Integer> downStops = new PriorityQueue<>(Collections.reverseOrder());',
      '',
      '    public void addStop(int floor) {',
      '        if (floor >= currentFloor) upStops.offer(floor);',
      '        else downStops.offer(floor);',
      '    }',
      '    public void step() {',
      '        if (dir == Direction.UP) {',
      '            if (!upStops.isEmpty()) {',
      '                currentFloor = upStops.poll();',
      '            } else if (!downStops.isEmpty()) {',
      '                dir = Direction.DOWN;',
      '                currentFloor = downStops.poll();',
      '            } else dir = Direction.IDLE;',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      'import heapq',
      '',
      'class ElevatorCar:',
      '    def __init__(self):',
      '        self.current_floor = 3',
      '        self.dir = "UP"',
      '        self.up_stops: list[int] = []      # Min-heap',
      '        self.down_stops: list[int] = []    # Max-heap (negated)',
      '',
      '    def add_stop(self, floor: int) -> None:',
      '        if floor >= self.current_floor:',
      '            heapq.heappush(self.up_stops, floor)',
      '        else:',
      '            heapq.heappush(self.down_stops, -floor)',
      '',
      '    def step(self) -> None:',
      '        if self.dir == "UP":',
      '            if self.up_stops:',
      '                self.current_floor = heapq.heappop(self.up_stops)',
      '            elif self.down_stops:',
      '                self.dir = "DOWN"',
      '                self.current_floor = -heapq.heappop(self.down_stops)',
      '            else:',
      '                self.dir = "IDLE"'
    ],
    scenarios: [
      {
        id: 'full-elevator-trace',
        label: '1. Complete Flow: Start at F3 (UP) → Press F7 & F2 → Queue in Heaps → Sweep UP to F7 → Reverse DOWN to F2',
        summary: 'Starts with the car at Floor 3 and traces button requests into the UP/DOWN heaps, sweeping UP to F7 first, then reversing DOWN to F2.',
        steps: [
          {
            title: 'Step 1: Start (Car at Floor 3, Moving UP) — Passengers Press F7 & F2',
            explanation: 'Starting state: Elevator car is at Floor 3 with dir = UP. Passengers press Floor 7 and Floor 2, sending addStop(7) and addStop(2) to ElevatorServer.',
            status: 'info',
            activeArchNodes: ['btn', 'disp'],
            activeArchEdge: { from: 'btn', to: 'disp', call: 'addStop(7), addStop(2)' },
            domainGroups: [
              {
                title: 'Building Shaft (Floors F1..F8)',
                layout: 'row',
                cells: [
                  { id: 'f1', label: 'F1', status: 'default' },
                  { id: 'f2', label: 'F2', sublabel: 'Button Pressed', badge: 'REQ', status: 'warning' },
                  { id: 'f3', label: 'F3 🛗', sublabel: 'Car Here (↑)', badge: 'START', status: 'active' },
                  { id: 'f5', label: 'F5', status: 'default' },
                  { id: 'f7', label: 'F7', sublabel: 'Button Pressed', badge: 'REQ', status: 'active' },
                  { id: 'f8', label: 'F8', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Car Floor', value: 'Floor 3' },
              { label: 'Direction', value: 'UP ↑' },
              { label: 'Requests', value: 'F7 & F2', changed: true }
            ],
            activeLinesJava: [4, 5, 9],
            activeLinesPy: [5, 6, 10]
          },
          {
            title: 'Step 2: Partition Stops into UpHeap [7] & DownHeap [2]',
            explanation: 'Since 7 >= currentFloor (3), Floor 7 is pushed into UpHeap (Min-Heap). Since 2 < 3, Floor 2 is held in DownWorkers (Max-Heap) so the elevator doesn’t zig-zag!',
            status: 'info',
            activeArchNodes: ['disp', 'up', 'down'],
            activeArchEdge: { from: 'disp', to: 'up', call: 'upStops.offer(7)' },
            domainGroups: [
              {
                title: 'Building Shaft (Heaps Partitioned)',
                layout: 'row',
                cells: [
                  { id: 'f1', label: 'F1', status: 'default' },
                  { id: 'f2', label: 'F2', sublabel: 'In downStops [2]', badge: '↓ QUEUED', status: 'warning' },
                  { id: 'f3', label: 'F3 🛗', sublabel: 'Moving UP ↑', badge: 'CAR ↑', status: 'active' },
                  { id: 'f5', label: 'F5', status: 'default' },
                  { id: 'f7', label: 'F7', sublabel: 'In upStops [7]', badge: '↑ NEXT', status: 'success' },
                  { id: 'f8', label: 'F8', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'upStops (MinHeap)', value: '[7]', changed: true },
              { label: 'downStops (MaxHeap)', value: '[2]', changed: true },
              { label: 'Next Target', value: 'Floor 7 (UP)', changed: true }
            ],
            activeLinesJava: [10, 11],
            activeLinesPy: [11, 12, 13, 14]
          },
          {
            title: 'Step 3: Poll UpHeap → Elevator Sweeps UP to Floor 7',
            explanation: 'step() sees dir == UP and polls Floor 7 from UpHeap. The elevator car moves smoothly up the shaft to Floor 7 (and skips Floor 8!).',
            status: 'success',
            activeArchNodes: ['disp', 'car', 'up'],
            activeArchEdge: { from: 'disp', to: 'car', call: 'upStops.poll() → F7' },
            domainGroups: [
              {
                title: 'Building Shaft (Floor 7 Served)',
                layout: 'row',
                cells: [
                  { id: 'f1', label: 'F1', status: 'default' },
                  { id: 'f2', label: 'F2', sublabel: 'Waiting in downStops', badge: '↓ WAIT', status: 'warning' },
                  { id: 'f3', label: 'F3', status: 'muted' },
                  { id: 'f5', label: 'F5', status: 'muted' },
                  { id: 'f7', label: 'F7 🛗', sublabel: 'Doors Open!', badge: 'SERVED ✓', status: 'success' },
                  { id: 'f8', label: 'F8', sublabel: 'Skipped (LOOK)', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Car Floor', value: 'Floor 7', changed: true },
              { label: 'upStops (MinHeap)', value: '[] (Empty)', changed: true },
              { label: 'downStops (MaxHeap)', value: '[2]' }
            ],
            activeLinesJava: [13, 14, 15, 16],
            activeLinesPy: [16, 17, 18, 19]
          },
          {
            title: 'Step 4: UpHeap Empty → Flip Direction DOWN & Serve Floor 2',
            explanation: 'With upStops empty, LOOK flips dir = DOWN and polls Floor 2 from DownWorkers Max-Heap, sweeping down to serve Floor 2!',
            status: 'success',
            activeArchNodes: ['up', 'down', 'car'],
            activeArchEdge: { from: 'down', to: 'car', call: 'dir=DOWN → poll F2' },
            domainGroups: [
              {
                title: 'Building Shaft (Floor 2 Served — Sweep Complete)',
                layout: 'row',
                cells: [
                  { id: 'f1', label: 'F1', status: 'default' },
                  { id: 'f2', label: 'F2 🛗', sublabel: 'Doors Open!', badge: 'SERVED ✓', status: 'success' },
                  { id: 'f3', label: 'F3', status: 'muted' },
                  { id: 'f5', label: 'F5', status: 'muted' },
                  { id: 'f7', label: 'F7', status: 'muted' },
                  { id: 'f8', label: 'F8', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Car Floor', value: 'Floor 2', changed: true },
              { label: 'Direction', value: 'DOWN ↓', changed: true },
              { label: 'All Queues', value: 'Empty (Done ✓)', changed: true }
            ],
            activeLinesJava: [17, 18, 19],
            activeLinesPy: [20, 21, 22]
          }
        ]
      }
    ]
  }
};
