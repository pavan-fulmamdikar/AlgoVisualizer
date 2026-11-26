import type { LLDProblemData } from './lldTypes';

export const LLD_PART1: Record<string, LLDProblemData> = {
  // ===========================================================================
  // 1. LRU CACHE (6-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'lru-cache': {
    slug: 'lru-cache',
    num: 1,
    title: 'LRU Cache',
    priority: 'Must Know',
    patterns: ['HashMap + Doubly Linked List', 'Sentinel Nodes (HEAD / TAIL)'],
    concurrencyNote: 'ReentrantReadWriteLock or Segmented ConcurrentHashMap Locks',
    analogy:
      'Think of a small book rack on your desk that holds only 2 books. Whenever you place a new book (put) or read an existing book (get), you put it on the FAR LEFT (Most Recently Used). When a 3rd book arrives and the rack is full, you push off the book on the FAR RIGHT (Least Recently Used) because you have not touched it in the longest time.',
    requirements: [
      'Fixed capacity N configured when the cache is created.',
      'get(key): Return value in O(1) time and move the node to the front (MRU).',
      'put(key, value): Insert or update in O(1) time. If size exceeds capacity, evict the tail node (LRU).',
      'Maintain O(1) time complexity for both operations using HashMap + Doubly Linked List.'
    ],
    patternExplanations: [
      {
        pattern: 'HashMap + Doubly Linked List',
        why: 'A HashMap gives O(1) key lookup but does not track recency order. A Doubly Linked List tracks recency order and allows O(1) node removal/insertion when given a direct node reference from the HashMap.'
      },
      {
        pattern: 'Dummy HEAD and TAIL Sentinels',
        why: 'Permanent HEAD and TAIL boundary nodes eliminate null checks when inserting at the front or evicting from the back.'
      }
    ],
    edgeCases: [
      {
        title: 'Calling put(key, newValue) on a key that already exists',
        solution: 'Update the existing node value in-place and move it to HEAD without increasing size or evicting another key.'
      },
      {
        title: 'Cache capacity is 1',
        solution: 'Dummy HEAD and TAIL sentinel nodes prevent null-pointer bugs when the sole element is evicted and replaced.'
      }
    ],
    followUps: [
      {
        q: 'How do you avoid a single global lock bottleneck in a multi-threaded LRU Cache?',
        a: 'Partition the cache into 16 or 32 independent LRU shards by hash(key) % numShards so threads accessing different shards never block each other.'
      }
    ],
    archNodes: [
      { id: 'client', label: 'Client', sublabel: 'get / put', layer: 'client', x: 110, y: 72 },
      { id: 'cache', label: 'LRUCache', sublabel: 'Capacity = 2', layer: 'controller', x: 345, y: 72 },
      { id: 'dll', label: 'Recency Queue', sublabel: 'HEAD ⇄ TAIL', layer: 'pattern', x: 460, y: 172 },
      { id: 'evict', label: 'LRU Evictor', sublabel: 'remove(tail.prev)', layer: 'service', x: 645, y: 172 },
      { id: 'map', label: 'HashMap Store', sublabel: 'key → Node*', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'client', to: 'cache', label: 'API' },
      { from: 'cache', to: 'map', label: 'O(1) map' },
      { from: 'cache', to: 'dll', label: 'order' },
      { from: 'dll', to: 'evict', label: 'overflow' },
      { from: 'evict', to: 'map', label: 'delete' }
    ],
    umlClasses: [
      {
        name: 'Node<K, V>',
        stereotype: 'class',
        role: 'Doubly-linked node storing key, value, prev, and next pointers for O(1) unlinking.',
        fields: ['+ key: int', '+ val: int', '+ prev: Node', '+ next: Node'],
        methods: ['+ Node(key, val)']
      },
      {
        name: 'LRUCache',
        stereotype: 'class',
        role: 'Combines HashMap<Integer, Node> for O(1) lookup with HEAD ⇄ TAIL list for O(1) recency tracking.',
        fields: ['- cap: int', '- map: Map<Integer, Node>', '- head: Node', '- tail: Node'],
        methods: ['+ get(key: int): int', '+ put(key: int, val: int): void', '- remove(n: Node): void', '- insertAfterHead(n: Node): void'],
        relations: [{ target: 'Node<K, V>', type: 'has-a', label: 'stores & links' }]
      }
    ],
    javaCode: [
      'class Node {',
      '    int key, val;',
      '    Node prev, next;',
      '    Node(int k, int v) { this.key = k; this.val = v; }',
      '}',
      '',
      'public class LRUCache {',
      '    private final int cap;',
      '    private final Map<Integer, Node> map = new HashMap<>();',
      '    private final Node head = new Node(0, 0), tail = new Node(0, 0);',
      '',
      '    public LRUCache(int capacity) {',
      '        this.cap = capacity;',
      '        head.next = tail; tail.prev = head;',
      '    }',
      '    public int get(int key) {',
      '        if (!map.containsKey(key)) return -1;',
      '        Node node = map.get(key);',
      '        remove(node); insertAfterHead(node);',
      '        return node.val;',
      '    }',
      '    public void put(int key, int val) {',
      '        if (map.containsKey(key)) remove(map.get(key));',
      '        Node node = new Node(key, val);',
      '        insertAfterHead(node);',
      '        map.put(key, node);',
      '        if (map.size() > cap) {',
      '            Node lru = tail.prev;',
      '            remove(lru);',
      '            map.remove(lru.key);',
      '        }',
      '    }',
      '    private void remove(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }',
      '    private void insertAfterHead(Node n) {',
      '        n.next = head.next; n.prev = head;',
      '        head.next.prev = n; head.next = n;',
      '    }',
      '}'
    ],
    pythonCode: [
      'class Node:',
      '    def __init__(self, key=0, val=0):',
      '        self.key, self.val = key, val',
      '        self.prev = self.next = None',
      '',
      'class LRUCache:',
      '    def __init__(self, capacity: int):',
      '        self.cap = capacity',
      '        self.map = {}',
      '        self.head, self.tail = Node(), Node()',
      '        self.head.next, self.tail.prev = self.tail, self.head',
      '',
      '    def get(self, key: int) -> int:',
      '        if key not in self.map:',
      '            return -1',
      '        node = self.map[key]',
      '        self._remove(node)',
      '        self._insert_after_head(node)',
      '        return node.val',
      '',
      '    def put(self, key: int, val: int) -> None:',
      '        if key in self.map:',
      '            self._remove(self.map[key])',
      '        node = Node(key, val)',
      '        self._insert_after_head(node)',
      '        self.map[key] = node',
      '        if len(self.map) > self.cap:',
      '            lru = self.tail.prev',
      '            self._remove(lru)',
      '            del self.map[lru.key]',
      '',
      '    def _remove(self, n: Node) -> None:',
      '        n.prev.next, n.next.prev = n.next, n.prev',
      '',
      '    def _insert_after_head(self, n: Node) -> None:',
      '        n.next, n.prev = self.head.next, self.head',
      '        self.head.next.prev = self.head.next = n'
    ],
    scenarios: [
      {
        id: 'full-lifecycle',
        label: '1. Full Lifecycle: Empty → Put(1) → Put(2) → Get(1) Hit → Put(3) Evicts 2',
        summary: 'Starts from an empty cache and traces every request packet through Client, LRUCache, HashMap, Recency Queue, and Eviction.',
        steps: [
          {
            title: 'Step 1: Start — Empty Cache & Client Sends put(1, 10)',
            explanation: 'We start from the very beginning: LRUCache(capacity=2) is empty (HEAD ⇄ TAIL). Alice clicks put(1, 10) on the Client, sending the first request to LRUCache.',
            status: 'info',
            activeArchNodes: ['client', 'cache'],
            activeArchEdge: { from: 'client', to: 'cache', call: 'put(1, 10)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right) & HashMap Store',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n1', label: 'Node(1:10)', sublabel: 'Inserting...', badge: 'REQ #1', status: 'active' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: 'put(1, 10)', changed: true },
              { label: 'Cache Size', value: '0 → 1 / 2', changed: true },
              { label: 'MRU (Front)', value: 'Key 1', changed: true }
            ],
            activeLinesJava: [12, 13, 14, 22, 24],
            activeLinesPy: [7, 8, 10, 11, 21, 24]
          },
          {
            title: 'Step 2: Store Key 1 in HashMap & Insert Node(1:10) at HEAD',
            explanation: 'LRUCache links Node(1, 10) right after HEAD in the Recency Queue and stores Key 1 → Node(1,10) inside the HashMap Store.',
            status: 'info',
            activeArchNodes: ['cache', 'dll', 'map'],
            activeArchEdge: { from: 'cache', to: 'map', call: 'map.put(1, Node)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right) & HashMap Store',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n1', label: '1 : 10', sublabel: 'MRU & LRU', badge: 'STORED', status: 'success' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: 'put(1, 10) Done' },
              { label: 'Cache Size', value: '1 / 2' },
              { label: 'MRU (Front)', value: 'Key 1' }
            ],
            activeLinesJava: [25, 26, 34, 35, 36],
            activeLinesPy: [25, 26, 35, 36, 37]
          },
          {
            title: 'Step 3: Client Sends put(2, 20) → Key 2 Becomes MRU',
            explanation: 'Next request put(2, 20) arrives from Client. Node(2, 20) is inserted right after HEAD, pushing Node(1, 10) toward TAIL (LRU). Cache is now full (2/2).',
            status: 'info',
            activeArchNodes: ['client', 'cache', 'dll'],
            activeArchEdge: { from: 'cache', to: 'dll', call: 'insertAfterHead(2:20)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right)',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n2', label: '2 : 20', sublabel: 'MRU (Newest)', badge: 'NEW', status: 'active' },
                  { id: 'n1', label: '1 : 10', sublabel: 'LRU (Oldest)', status: 'default' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: 'put(2, 20)', changed: true },
              { label: 'Cache Size', value: '2 / 2 (Full)', changed: true },
              { label: 'MRU → LRU', value: 'Key 2 → Key 1', changed: true }
            ],
            activeLinesJava: [22, 24, 25, 26],
            activeLinesPy: [21, 24, 25, 26]
          },
          {
            title: 'Step 4: Client Sends get(1) → O(1) Lookup & Promote Key 1 to MRU',
            explanation: 'Client requests get(1). LRUCache fetches Node(1, 10) from HashMap in O(1) and moves it to HEAD. Key 1 is now MRU, leaving Key 2 at TAIL as the LRU candidate!',
            status: 'success',
            activeArchNodes: ['client', 'cache', 'map', 'dll'],
            activeArchEdge: { from: 'cache', to: 'dll', call: 'moveToHead(1:10)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right)',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n1', label: '1 : 10', sublabel: 'Promoted MRU', badge: 'HIT → 10', status: 'success' },
                  { id: 'n2', label: '2 : 20', sublabel: 'Now at TAIL!', badge: 'LRU', status: 'warning' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: 'get(1) → 10', changed: true },
              { label: 'Cache Size', value: '2 / 2' },
              { label: 'MRU → LRU', value: 'Key 1 → Key 2', changed: true }
            ],
            activeLinesJava: [16, 18, 19, 20],
            activeLinesPy: [13, 16, 17, 18, 19]
          },
          {
            title: 'Step 5: Client Sends put(3, 30) → Overflow Triggers Eviction of Key 2',
            explanation: 'Node(3, 30) is inserted at HEAD (size = 3 > capacity 2). Recency Queue triggers Evict Worker on tail.prev: Node(2, 20)!',
            status: 'warning',
            activeArchNodes: ['cache', 'dll', 'evict'],
            activeArchEdge: { from: 'dll', to: 'evict', call: 'evict(tail.prev=2)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right)',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n3', label: '3 : 30', sublabel: 'New MRU', badge: 'NEW', status: 'active' },
                  { id: 'n1', label: '1 : 10', sublabel: 'Kept', status: 'default' },
                  { id: 'n2', label: '2 : 20', sublabel: 'tail.prev', badge: 'EVICTING', status: 'danger' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Request', value: 'put(3, 30)', changed: true },
              { label: 'Cache Size', value: '3 / 2 (Overflow)', changed: true },
              { label: 'Evict Victim', value: 'Key 2 (tail.prev)', changed: true }
            ],
            activeLinesJava: [24, 25, 26, 27, 28],
            activeLinesPy: [24, 25, 26, 27, 28]
          },
          {
            title: 'Step 6: Evict Worker Deletes Key 2 from HashMap → Request Complete',
            explanation: 'Evict Worker unlinks Node(2, 20) and deletes Key 2 from HashMap Store in O(1). Final cache holds [3:30 (MRU) ⇄ 1:10 (LRU)].',
            status: 'success',
            activeArchNodes: ['evict', 'map', 'client'],
            activeArchEdge: { from: 'evict', to: 'map', call: 'map.remove(2)' },
            domainGroups: [
              {
                title: 'Doubly Linked List (MRU Left ⇄ LRU Right)',
                layout: 'chain',
                cells: [
                  { id: 'h', label: 'HEAD', sublabel: 'sentinel', status: 'muted' },
                  { id: 'n3', label: '3 : 30', sublabel: 'MRU', badge: 'ACTIVE', status: 'success' },
                  { id: 'n1', label: '1 : 10', sublabel: 'LRU', badge: 'ACTIVE', status: 'default' },
                  { id: 't', label: 'TAIL', sublabel: 'sentinel', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Status', value: 'Eviction Complete ✓', changed: true },
              { label: 'Cache Size', value: '2 / 2', changed: true },
              { label: 'MRU → LRU', value: 'Key 3 → Key 1', changed: true }
            ],
            activeLinesJava: [29, 30],
            activeLinesPy: [29, 30]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 2. PARKING LOT (6-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'parking-lot': {
    slug: 'parking-lot',
    num: 2,
    title: 'Parking Lot',
    priority: 'Must Know',
    patterns: ['Strategy (Spot & Pricing)', 'Factory', 'Singleton'],
    concurrencyNote: 'Synchronized Spot.tryPark() or Optimistic CAS per Stall',
    analogy:
      'Think of a smart parking garage: 1) You press "Get Ticket" at the Entry Gate. 2) The Gate asks the Parking Server for a Car stall. 3) The Server uses a Spot-Finder Rule (Nearest Free Car Spot) and locks Stall F1-C2 in the Database. 4) The Gate prints Ticket #104. When you leave, a Pricing Rule calculates your fee and frees the stall.',
    requirements: [
      'Multiple floors and spot types (BIKE, CAR, TRUCK).',
      'Pluggable SpotStrategy to pick an available compatible stall.',
      'Thread-safe spot reservation and Ticket generation at entry.',
      'Pluggable PricingStrategy to compute fee and release spot at exit.'
    ],
    patternExplanations: [
      {
        pattern: 'Strategy Pattern (SpotStrategy & PricingStrategy)',
        why: 'Decouples spot selection (Nearest-First vs Lowest-Floor) and fee calculation (Hourly vs Flat Rate) from the core ParkingLot service.'
      },
      {
        pattern: 'Thread-Safe Spot Reservation (tryPark)',
        why: 'Prevents two entry gates from assigning the exact same stall to two arriving cars at the same instant.'
      }
    ],
    edgeCases: [
      {
        title: 'Two gates request a CAR spot at the exact same millisecond',
        solution: 'synchronized tryPark() ensures only one thread claims F1-C2; the losing thread moves on to the next free CAR spot.'
      }
    ],
    followUps: [
      {
        q: 'How do we avoid O(N) scanning to find the nearest free spot?',
        a: 'Maintain a Min-Heap (PriorityQueue) of free spots per VehicleType ordered by distance from each entrance gate.'
      }
    ],
    archNodes: [
      { id: 'gate', label: 'Entry Gate', sublabel: 'Driver / Sensor', layer: 'client', x: 110, y: 72 },
      { id: 'lot', label: 'ParkingServer', sublabel: 'park / exit', layer: 'controller', x: 345, y: 72 },
      { id: 'spotStrat', label: 'SpotStrategy', sublabel: 'Nearest Free', layer: 'pattern', x: 460, y: 172 },
      { id: 'priceStrat', label: 'PricingEngine', sublabel: 'computeFee(t)', layer: 'service', x: 645, y: 172 },
      { id: 'floor', label: 'Stall Database', sublabel: 'Floor 1 Stalls', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'gate', to: 'lot', label: 'HTTP' },
      { from: 'lot', to: 'spotStrat', label: 'findSpot' },
      { from: 'spotStrat', to: 'floor', label: 'lock stall' },
      { from: 'lot', to: 'priceStrat', label: 'bill' },
      { from: 'priceStrat', to: 'floor', label: 'vacate' }
    ],
    umlClasses: [
      {
        name: 'SpotStrategy',
        stereotype: 'interface',
        role: 'Strategy interface that selects the best free stall for a vehicle type.',
        fields: [],
        methods: ['+ findSpot(spots: List<ParkingSpot>, type: VehicleType): ParkingSpot']
      },
      {
        name: 'PricingStrategy',
        stereotype: 'interface',
        role: 'Strategy interface that calculates parking fee on exit.',
        fields: [],
        methods: ['+ computeFee(ticket: Ticket, hours: long): double']
      },
      {
        name: 'ParkingLot',
        stereotype: 'singleton',
        role: 'Coordinates gates, strategies, stall database, and tickets.',
        fields: ['- spots: List<ParkingSpot>', '- spotStrategy: SpotStrategy', '- pricingStrategy: PricingStrategy'],
        methods: ['+ park(v: Vehicle): Ticket', '+ exit(t: Ticket, hours: long): double'],
        relations: [
          { target: 'SpotStrategy', type: 'uses' },
          { target: 'PricingStrategy', type: 'uses' }
        ]
      }
    ],
    javaCode: [
      'enum VehicleType { BIKE, CAR, TRUCK }',
      '',
      'interface SpotStrategy {',
      '    ParkingSpot findSpot(List<ParkingSpot> spots, VehicleType type);',
      '}',
      'interface PricingStrategy {',
      '    double computeFee(Ticket t, long hours);',
      '}',
      'class ParkingSpot {',
      '    final String id; final VehicleType type;',
      '    Vehicle current;',
      '    synchronized boolean tryPark(Vehicle v) {',
      '        if (current != null || this.type != v.type) return false;',
      '        this.current = v; return true;',
      '    }',
      '    synchronized void vacate() { this.current = null; }',
      '}',
      'public class ParkingLot {',
      '    private final List<ParkingSpot> spots;',
      '    private final SpotStrategy spotStrategy;',
      '    private final PricingStrategy pricingStrategy;',
      '',
      '    public Ticket park(Vehicle v) {',
      '        ParkingSpot spot = spotStrategy.findSpot(spots, v.type);',
      '        if (spot == null) throw new IllegalStateException("Lot Full");',
      '        return new Ticket(v, spot, System.currentTimeMillis());',
      '    }',
      '    public double exit(Ticket t, long hoursStayed) {',
      '        double fee = pricingStrategy.computeFee(t, hoursStayed);',
      '        t.spot.vacate();',
      '        return fee;',
      '    }',
      '}'
    ],
    pythonCode: [
      'from enum import Enum',
      'from threading import Lock',
      '',
      'class VehicleType(Enum):',
      '    BIKE, CAR, TRUCK = "BIKE", "CAR", "TRUCK"',
      '',
      'class ParkingSpot:',
      '    def __init__(self, spot_id: str, spot_type: VehicleType):',
      '        self.id, self.type = spot_id, spot_type',
      '        self.current = None',
      '        self._lock = Lock()',
      '',
      '    def try_park(self, vehicle) -> bool:',
      '        with self._lock:',
      '            if self.current is not None or self.type != vehicle.type:',
      '                return False',
      '            self.current = vehicle',
      '            return True',
      '',
      '    def vacate(self) -> None:',
      '        with self._lock:',
      '            self.current = None',
      '',
      'class ParkingLot:',
      '    def __init__(self, spots, spot_strategy, pricing_strategy):',
      '        self.spots = spots',
      '        self.spot_strategy = spot_strategy',
      '        self.pricing_strategy = pricing_strategy',
      '',
      '    def park(self, vehicle):',
      '        spot = self.spot_strategy.find_spot(self.spots, vehicle.type)',
      '        if not spot:',
      '            raise RuntimeError("Lot Full")',
      '        return Ticket(vehicle, spot)',
      '',
      '    def exit(self, ticket, hours: int) -> float:',
      '        fee = self.pricing_strategy.compute_fee(ticket, hours)',
      '        ticket.spot.vacate()',
      '        return fee'
    ],
    scenarios: [
      {
        id: 'park-to-exit-flow',
        label: '1. Complete Journey: Car Arrives → Find Spot → Lock DB → Ticket → Exit & Pay',
        summary: 'Traces a car from the moment it pulls up to Entry Gate through strategy selection, DB stall locking, ticket printing, and exit billing.',
        steps: [
          {
            title: 'Step 1: Car Arrives at Entry Gate & Requests Parking',
            explanation: 'We start from the beginning: Driver arrives at Entry Gate in a CAR (KA-01-99) and presses "Get Ticket". Entry Gate sends park(CAR) to ParkingServer.',
            status: 'info',
            activeArchNodes: ['gate', 'lot'],
            activeArchEdge: { from: 'gate', to: 'lot', call: 'POST /park (CAR)' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (Initial State)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'BIKE · Free', status: 'default' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'CAR · Occupied', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: 'CAR · Free', status: 'default' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '1. Gate Request', changed: true },
              { label: 'Vehicle', value: 'CAR (KA-01-99)' },
              { label: 'Assigned Stall', value: 'Pending...' }
            ],
            activeLinesJava: [23],
            activeLinesPy: [30]
          },
          {
            title: 'Step 2: ParkingServer Delegates to SpotStrategy',
            explanation: 'ParkingServer does not hardcode how stalls are chosen—it calls spotStrategy.findSpot(spots, CAR) to find the nearest compatible stall.',
            status: 'info',
            activeArchNodes: ['lot', 'spotStrat'],
            activeArchEdge: { from: 'lot', to: 'spotStrat', call: 'findSpot(CAR)' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (SpotStrategy Scanning...)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'Skip (BIKE != CAR)', status: 'muted' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'Skip (Occupied)', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: 'Match! CAR · Free', badge: 'CANDIDATE', status: 'active' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '2. Strategy Search', changed: true },
              { label: 'F1-B1 / F1-C1', value: 'Skipped' },
              { label: 'Candidate', value: 'F1-C2', changed: true }
            ],
            activeLinesJava: [3, 4, 24],
            activeLinesPy: [31]
          },
          {
            title: 'Step 3: SpotStrategy Atomically Locks Stall F1-C2 in Database',
            explanation: 'SpotStrategy invokes F1-C2.tryPark(car) on Stall Database. The synchronized lock verifies current == null and assigns KA-01-99 to F1-C2.',
            status: 'success',
            activeArchNodes: ['spotStrat', 'floor'],
            activeArchEdge: { from: 'spotStrat', to: 'floor', call: 'tryPark(F1-C2)' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (Stall F1-C2 Locked)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'BIKE · Free', status: 'default' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'CAR · Occupied', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: 'Car KA-01-99', badge: 'LOCKED ✓', status: 'success' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '3. DB Lock', changed: true },
              { label: 'Stall F1-C2', value: 'OCCUPIED (KA-01-99)', changed: true },
              { label: 'Thread Lock', value: 'Acquired ✓' }
            ],
            activeLinesJava: [12, 13, 14],
            activeLinesPy: [13, 14, 15, 17, 18]
          },
          {
            title: 'Step 4: ParkingServer Returns Ticket #TKT-104 to Entry Gate',
            explanation: 'ParkingServer creates Ticket(KA-01-99, F1-C2, entryTime) and sends the response back to Entry Gate. The barrier opens!',
            status: 'success',
            activeArchNodes: ['lot', 'gate'],
            activeArchEdge: { from: 'lot', to: 'gate', call: 'Ticket #TKT-104' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (Car Parked in F1-C2)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'BIKE · Free', status: 'default' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'CAR · Occupied', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: 'Ticket #TKT-104', badge: 'PARKED', status: 'active' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '4. Ticket Issued', changed: true },
              { label: 'Ticket ID', value: 'TKT-104', changed: true },
              { label: 'Gate Barrier', value: 'OPEN 🟢', changed: true }
            ],
            activeLinesJava: [26],
            activeLinesPy: [34]
          },
          {
            title: 'Step 5: Car Scans Ticket at Exit → PricingEngine Computes Fee',
            explanation: '3 hours later, driver scans TKT-104 at Exit. ParkingServer calls pricingStrategy.computeFee(TKT-104, 3h) → 3 × ₹50 = ₹150.',
            status: 'info',
            activeArchNodes: ['gate', 'lot', 'priceStrat'],
            activeArchEdge: { from: 'lot', to: 'priceStrat', call: 'computeFee(3h)' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (Calculating Exit Fee)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'BIKE · Free', status: 'default' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'CAR · Occupied', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: '3 hrs × ₹50 = ₹150', badge: 'BILLING', status: 'warning' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '5. Exit Billing', changed: true },
              { label: 'Stay Duration', value: '3 Hours', changed: true },
              { label: 'Computed Fee', value: '₹150', changed: true }
            ],
            activeLinesJava: [28, 29],
            activeLinesPy: [36, 37]
          },
          {
            title: 'Step 6: PricingEngine Vacates Stall F1-C2 in Database → Exit Complete',
            explanation: 'Once ₹150 is paid, t.spot.vacate() clears F1-C2 in the Stall Database back to FREE so the next car can use it!',
            status: 'success',
            activeArchNodes: ['priceStrat', 'floor', 'gate'],
            activeArchEdge: { from: 'priceStrat', to: 'floor', call: 'vacate(F1-C2)' },
            domainGroups: [
              {
                title: 'Floor 1 Stalls (F1-C2 Released)',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'F1-B1', sublabel: 'BIKE · Free', status: 'default' },
                  { id: 'c1', label: 'F1-C1', sublabel: 'CAR · Occupied', badge: 'BUSY', status: 'danger' },
                  { id: 'c2', label: 'F1-C2', sublabel: 'CAR · Free Again!', badge: 'VACATED ✓', status: 'success' },
                  { id: 't1', label: 'F1-T1', sublabel: 'TRUCK · Free', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Step', value: '6. Stall Released', changed: true },
              { label: 'Receipt', value: '₹150 Paid ✓', changed: true },
              { label: 'Stall F1-C2', value: 'FREE', changed: true }
            ],
            activeLinesJava: [16, 30, 31],
            activeLinesPy: [20, 21, 22, 38, 39]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 3. SNAKE & LADDER (5-Step Full Turn Lifecycle from Start)
  // ===========================================================================
  'snake-and-ladder': {
    slug: 'snake-and-ladder',
    num: 3,
    title: 'Snake & Ladder',
    priority: 'Important',
    patterns: ['Unified Jump Entity', 'FIFO Turn Queue'],
    concurrencyNote: 'Single Turn-Loop Lock per Game Room',
    analogy:
      'Both a Ladder and a Snake just teleport a player from startCell to endCell! Storing one optional Jump(start, end) on each board square avoids duplicate classes, and a FIFO Queue rotates players fairly turn by turn.',
    requirements: [
      'Configurable Board with N cells and Jump objects (Ladders & Snakes).',
      'FIFO Queue<Player> for turn rotation.',
      'Dice component returning random roll.',
      'Win detection when player lands exactly on the last board square.'
    ],
    patternExplanations: [
      {
        pattern: 'Unified Jump Class (Snake & Ladder)',
        why: 'Eliminates separate Snake and Ladder checks—if cell.jump != null, teleport player to cell.jump.end.'
      }
    ],
    edgeCases: [
      {
        title: 'Roll overshoots final square (e.g., at 9 and rolls 4 on a 10-cell board)',
        solution: 'Ignore move if pos + roll > boardSize and rotate turn.'
      }
    ],
    followUps: [
      {
        q: 'How do you validate that a generated board is solvable?',
        a: 'Run BFS from cell 0 to cell N to confirm a valid path exists with no infinite snake loops.'
      }
    ],
    archNodes: [
      { id: 'player', label: 'Player Turn', sublabel: 'Click Roll', layer: 'client', x: 110, y: 72 },
      { id: 'game', label: 'GameEngine', sublabel: 'playTurn()', layer: 'controller', x: 345, y: 72 },
      { id: 'queue', label: 'Turn Queue', sublabel: 'Alice → Bob', layer: 'pattern', x: 460, y: 172 },
      { id: 'jump', label: 'Jump Resolver', sublabel: 'start → end', layer: 'service', x: 645, y: 172 },
      { id: 'board', label: 'Board State', sublabel: 'Cells 1..10', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'player', to: 'game', label: 'roll' },
      { from: 'game', to: 'queue', label: 'poll/offer' },
      { from: 'game', to: 'board', label: 'check cell' },
      { from: 'queue', to: 'jump', label: 'teleport' },
      { from: 'jump', to: 'board', label: 'update pos' }
    ],
    umlClasses: [
      {
        name: 'Jump',
        stereotype: 'class',
        role: 'Represents either a Ladder (end > start) or Snake (end < start).',
        fields: ['+ start: int', '+ end: int'],
        methods: []
      },
      {
        name: 'SnakeAndLadderGame',
        stereotype: 'class',
        role: 'Polls next player from queue, rolls dice, resolves any cell Jump, and checks win condition.',
        fields: ['- board: Cell[]', '- players: Queue<Player>', '- dice: Dice'],
        methods: ['+ playTurn(): void']
      }
    ],
    javaCode: [
      'class Jump {',
      '    final int start, end;',
      '    Jump(int s, int e) { this.start = s; this.end = e; }',
      '}',
      'class Cell { Jump jump; }',
      '',
      'public class SnakeAndLadderGame {',
      '    private final Cell[] board;',
      '    private final Queue<Player> players;',
      '    private final Dice dice;',
      '',
      '    public void playTurn() {',
      '        Player p = players.poll();',
      '        int roll = dice.roll();',
      '        int next = p.pos + roll;',
      '        if (next <= board.length - 1) {',
      '            if (board[next].jump != null) {',
      '                next = board[next].jump.end;',
      '            }',
      '            p.pos = next;',
      '        }',
      '        if (p.pos == board.length - 1) {',
      '            System.out.println(p.name + " WINS!");',
      '        } else {',
      '            players.offer(p);',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      'from collections import deque',
      '',
      'class Jump:',
      '    def __init__(self, start: int, end: int):',
      '        self.start, self.end = start, end',
      '',
      'class Cell:',
      '    def __init__(self, jump: Jump | None = None):',
      '        self.jump = jump',
      '',
      'class SnakeAndLadderGame:',
      '    def __init__(self, board_size: int, cells: list[Cell], players, dice):',
      '        self.size = board_size',
      '        self.board = cells',
      '        self.players = deque(players)',
      '        self.dice = dice',
      '',
      '    def play_turn(self):',
      '        p = self.players.popleft()',
      '        roll = self.dice.roll()',
      '        nxt = p.pos + roll',
      '        if nxt <= self.size:',
      '            if self.board[nxt].jump:',
      '                nxt = self.board[nxt].jump.end',
      '            p.pos = nxt',
      '        if p.pos == self.size:',
      '            print(f"{p.name} WINS!")',
      '        else:',
      '            self.players.append(p)'
    ],
    scenarios: [
      {
        id: 'full-game-turn',
        label: '1. Complete Turn Flow: Start at 0 → Poll Player → Roll Dice → Climb Ladder → Rotate Queue',
        summary: 'Traces a complete turn starting from players at position 0 through queue polling, dice roll, ladder jump resolution, and winning.',
        steps: [
          {
            title: 'Step 1: Start — Both Players at Pos 0 & Alice Clicks Roll',
            explanation: 'Game starts with Alice and Bob at position 0. Alice clicks "Roll Dice", triggering gameEngine.playTurn().',
            status: 'info',
            activeArchNodes: ['player', 'game'],
            activeArchEdge: { from: 'player', to: 'game', call: 'playTurn()' },
            domainGroups: [
              {
                title: 'Board Cells (1..10) — Ladder at 3→8, Snake at 6→2',
                layout: 'row',
                cells: [
                  { id: 'c0', label: 'Start (0)', sublabel: 'Alice, Bob', badge: 'START', status: 'active' },
                  { id: 'c3', label: 'Cell 3 🪜8', sublabel: 'Ladder → 8', status: 'default' },
                  { id: 'c6', label: 'Cell 6 🐍2', sublabel: 'Snake → 2', status: 'default' },
                  { id: 'c8', label: 'Cell 8', sublabel: 'Empty', status: 'default' },
                  { id: 'c10', label: 'Cell 10 🏆', sublabel: 'Goal', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Queue', value: '[Alice, Bob]' },
              { label: 'Alice Pos', value: '0' },
              { label: 'Bob Pos', value: '0' }
            ],
            activeLinesJava: [12],
            activeLinesPy: [18]
          },
          {
            title: 'Step 2: Poll Alice from Turn Queue & Roll Dice (🎲 3)',
            explanation: 'GameEngine polls Alice from the front of the FIFO Turn Queue and rolls the Dice → 3. Target square = 0 + 3 = Cell 3.',
            status: 'info',
            activeArchNodes: ['game', 'queue'],
            activeArchEdge: { from: 'game', to: 'queue', call: 'players.poll() → Alice' },
            domainGroups: [
              {
                title: 'Board Cells (1..10)',
                layout: 'row',
                cells: [
                  { id: 'c0', label: 'Start (0)', sublabel: 'Bob', status: 'default' },
                  { id: 'c3', label: 'Cell 3 🪜8', sublabel: 'Alice landed!', badge: '🎲 ROLL 3', status: 'warning' },
                  { id: 'c6', label: 'Cell 6 🐍2', sublabel: 'Snake → 2', status: 'default' },
                  { id: 'c8', label: 'Cell 8', sublabel: 'Ladder Top', status: 'default' },
                  { id: 'c10', label: 'Cell 10 🏆', sublabel: 'Goal', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Active Player', value: 'Alice', changed: true },
              { label: 'Dice Roll', value: '🎲 3', changed: true },
              { label: 'Landing Cell', value: 'Cell 3', changed: true }
            ],
            activeLinesJava: [13, 14, 15],
            activeLinesPy: [19, 20, 21]
          },
          {
            title: 'Step 3: Jump Resolver Teleports Alice Up Ladder (3 → 8)',
            explanation: 'Cell 3 has a non-null Jump(start=3, end=8). Jump Resolver teleports Alice to Cell 8 and updates Board State!',
            status: 'success',
            activeArchNodes: ['queue', 'jump', 'board'],
            activeArchEdge: { from: 'jump', to: 'board', call: 'jump.end → Cell 8' },
            domainGroups: [
              {
                title: 'Board Cells (1..10)',
                layout: 'row',
                cells: [
                  { id: 'c0', label: 'Start (0)', sublabel: 'Bob', status: 'default' },
                  { id: 'c3', label: 'Cell 3 🪜8', sublabel: 'Climbed!', status: 'muted' },
                  { id: 'c6', label: 'Cell 6 🐍2', sublabel: 'Snake → 2', status: 'default' },
                  { id: 'c8', label: 'Cell 8', sublabel: 'Alice (via 🪜)', badge: 'ALICE @ 8', status: 'success' },
                  { id: 'c10', label: 'Cell 10 🏆', sublabel: 'Goal', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Active Player', value: 'Alice' },
              { label: 'Jump Applied', value: 'Ladder 3 → 8 🪜', changed: true },
              { label: 'Alice Pos', value: '8', changed: true }
            ],
            activeLinesJava: [16, 17, 18, 20],
            activeLinesPy: [22, 23, 24, 25]
          },
          {
            title: 'Step 4: Re-Queue Alice at Tail & Next Turn Reaches Cell 10 (Win!)',
            explanation: 'Alice is offered back to the tail of Turn Queue. On her next turn at Cell 8, she rolls 2 to reach Cell 10 and wins the game!',
            status: 'success',
            activeArchNodes: ['game', 'board', 'player'],
            activeArchEdge: { from: 'game', to: 'board', call: 'p.pos == 10 (WIN!)' },
            domainGroups: [
              {
                title: 'Board Cells (1..10)',
                layout: 'row',
                cells: [
                  { id: 'c0', label: 'Start (0)', status: 'muted' },
                  { id: 'c3', label: 'Cell 3 🪜8', status: 'muted' },
                  { id: 'c6', label: 'Cell 6 🐍2', sublabel: 'Bob @ 2', status: 'default' },
                  { id: 'c8', label: 'Cell 8', status: 'muted' },
                  { id: 'c10', label: 'Cell 10 🏆', sublabel: 'Alice Wins!', badge: 'WINNER 🏆', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Winner', value: 'Alice 🏆', changed: true },
              { label: 'Alice Pos', value: '10 (Goal)', changed: true },
              { label: 'Game Status', value: 'COMPLETED', changed: true }
            ],
            activeLinesJava: [22, 23, 25],
            activeLinesPy: [26, 27, 29]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 4. DESIGN A LOGGER (5-Step Request Pipeline from Start)
  // ===========================================================================
  'design-logger': {
    slug: 'design-logger',
    num: 4,
    title: 'Design a Logger',
    priority: 'Important',
    patterns: ['Chain of Responsibility', 'Observer (Log Sinks)', 'Singleton'],
    concurrencyNote: 'Async RingBuffer / BlockingQueue Worker for Non-Blocking I/O',
    analogy:
      'A log call travels down a pipeline of handlers: InfoHandler → DebugHandler → ErrorHandler. Each handler checks if the message matches its severity level; when it matches, it broadcasts the formatted log to all attached output sinks (Console, File, Alert).',
    requirements: [
      'Severity levels: INFO (1), DEBUG (2), ERROR (3).',
      'Chain of Responsibility pattern linking handlers.',
      'Pluggable LogSink observers (ConsoleSink, FileSink).',
      'Singleton Logger facade.'
    ],
    patternExplanations: [
      {
        pattern: 'Chain of Responsibility (LogHandler)',
        why: 'Decouples level filtering so new handlers can be chained without editing a monolithic switch statement.'
      }
    ],
    edgeCases: [
      {
        title: 'High-volume disk logging slowing down request threads',
        solution: 'Enqueue log events into an async ring buffer flushed by a background I/O thread.'
      }
    ],
    followUps: [
      {
        q: 'How do you prevent log loss if the process crashes with buffered logs?',
        a: 'Register a JVM shutdown hook and flush immediately on ERROR/FATAL level events.'
      }
    ],
    archNodes: [
      { id: 'app', label: 'App Client', sublabel: 'logger.error()', layer: 'client', x: 110, y: 72 },
      { id: 'info', label: 'InfoHandler', sublabel: 'Level == 1', layer: 'controller', x: 345, y: 72 },
      { id: 'debug', label: 'DebugHandler', sublabel: 'Level == 2', layer: 'pattern', x: 460, y: 172 },
      { id: 'err', label: 'ErrorHandler', sublabel: 'Level == 3', layer: 'service', x: 645, y: 172 },
      { id: 'sink', label: 'Log Sinks DB', sublabel: 'Console + File', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'app', to: 'info', label: 'log(3)' },
      { from: 'info', to: 'debug', label: 'forward' },
      { from: 'debug', to: 'err', label: 'forward' },
      { from: 'err', to: 'sink', label: 'write()' }
    ],
    umlClasses: [
      {
        name: 'LogSink',
        stereotype: 'interface',
        role: 'Output destination observer (Console, File, CloudWatch).',
        fields: [],
        methods: ['+ write(msg: String): void']
      },
      {
        name: 'LogHandler',
        stereotype: 'class',
        role: 'Node in the handler chain that filters by severity level and forwards to next.',
        fields: ['# level: int', '# next: LogHandler', '# sinks: List<LogSink>'],
        methods: ['+ log(reqLevel: int, msg: String): void']
      }
    ],
    javaCode: [
      'interface LogSink { void write(String msg); }',
      '',
      'abstract class LogHandler {',
      '    public static final int INFO = 1, DEBUG = 2, ERROR = 3;',
      '    protected final int level;',
      '    protected LogHandler next;',
      '    protected final List<LogSink> sinks = new ArrayList<>();',
      '',
      '    LogHandler(int level) { this.level = level; }',
      '    public void addSink(LogSink s) { sinks.add(s); }',
      '',
      '    public void log(int reqLevel, String msg) {',
      '        if (this.level == reqLevel) {',
      '            for (LogSink s : sinks) s.write("[" + reqLevel + "] " + msg);',
      '        }',
      '        if (next != null) {',
      '            next.log(reqLevel, msg);',
      '        }',
      '    }',
      '}',
      'public class Logger {',
      '    private final LogHandler chainHead;',
      '    public void error(String msg) { chainHead.log(LogHandler.ERROR, msg); }',
      '}'
    ],
    pythonCode: [
      'class LogSink:',
      '    def write(self, msg: str) -> None: ...',
      '',
      'class LogHandler:',
      '    INFO, DEBUG, ERROR = 1, 2, 3',
      '    def __init__(self, level: int, nxt=None):',
      '        self.level = level',
      '        self.next = nxt',
      '        self.sinks: list[LogSink] = []',
      '',
      '    def add_sink(self, sink: LogSink) -> None:',
      '        self.sinks.append(sink)',
      '',
      '    def log(self, req_level: int, msg: str) -> None:',
      '        if self.level == req_level:',
      '            for s in self.sinks:',
      '                s.write(f"[{req_level}] {msg}")',
      '        if self.next:',
      '            self.next.log(req_level, msg)',
      '',
      'class Logger:',
      '    def __init__(self, chain_head: LogHandler):',
      '        self.chain_head = chain_head',
      '    def error(self, msg: str) -> None:',
      '        self.chain_head.log(LogHandler.ERROR, msg)'
    ],
    scenarios: [
      {
        id: 'full-log-trace',
        label: '1. Full Request Trace: App Calls logger.error("DB Timeout") → Chain → Sinks',
        summary: 'Traces a log request from the application call through every link in the Chain of Responsibility until ErrorHandler writes to Sinks.',
        steps: [
          {
            title: 'Step 1: App Client Calls logger.error("DB Timeout")',
            explanation: 'Starting at the caller: App Client invokes logger.error("DB Timeout"), which sends log(level=3, "DB Timeout") to the head of the chain: InfoHandler.',
            status: 'info',
            activeArchNodes: ['app', 'info'],
            activeArchEdge: { from: 'app', to: 'info', call: 'log(ERROR=3)' },
            domainGroups: [
              {
                title: 'Handler Chain & Output Sinks',
                layout: 'chain',
                cells: [
                  { id: 'h1', label: 'InfoHandler (1)', sublabel: 'Receiving req...', badge: 'STEP 1', status: 'active' },
                  { id: 'h2', label: 'DebugHandler (2)', sublabel: 'Idle', status: 'default' },
                  { id: 'h3', label: 'ErrorHandler (3)', sublabel: 'Idle', status: 'default' },
                  { id: 's1', label: 'Console + File', sublabel: '0 writes', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Event', value: 'error("DB Timeout")', changed: true },
              { label: 'At Handler', value: 'InfoHandler (lvl 1)', changed: true },
              { label: 'Level Match?', value: '1 != 3 (No)' }
            ],
            activeLinesJava: [23, 12],
            activeLinesPy: [25, 14]
          },
          {
            title: 'Step 2: InfoHandler (1 != 3) Forwards Request to DebugHandler',
            explanation: 'InfoHandler checks this.level (1) == reqLevel (3) → false. It skips its sinks and forwards the request along next.log(3, "DB Timeout") to DebugHandler.',
            status: 'info',
            activeArchNodes: ['info', 'debug'],
            activeArchEdge: { from: 'info', to: 'debug', call: 'next.log(3)' },
            domainGroups: [
              {
                title: 'Handler Chain & Output Sinks',
                layout: 'chain',
                cells: [
                  { id: 'h1', label: 'InfoHandler (1)', sublabel: 'Forwarded', status: 'muted' },
                  { id: 'h2', label: 'DebugHandler (2)', sublabel: 'Checking 2 == 3', badge: 'STEP 2', status: 'active' },
                  { id: 'h3', label: 'ErrorHandler (3)', sublabel: 'Waiting', status: 'default' },
                  { id: 's1', label: 'Console + File', sublabel: '0 writes', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Event', value: 'error("DB Timeout")' },
              { label: 'At Handler', value: 'DebugHandler (lvl 2)', changed: true },
              { label: 'Level Match?', value: '2 != 3 (Forward)', changed: true }
            ],
            activeLinesJava: [13, 16, 17],
            activeLinesPy: [15, 18, 19]
          },
          {
            title: 'Step 3: DebugHandler (2 != 3) Forwards Request to ErrorHandler',
            explanation: 'DebugHandler checks 2 == 3 → false, and forwards the request packet down the chain to ErrorHandler (level = 3).',
            status: 'info',
            activeArchNodes: ['debug', 'err'],
            activeArchEdge: { from: 'debug', to: 'err', call: 'next.log(3)' },
            domainGroups: [
              {
                title: 'Handler Chain & Output Sinks',
                layout: 'chain',
                cells: [
                  { id: 'h1', label: 'InfoHandler (1)', sublabel: 'Passed', status: 'muted' },
                  { id: 'h2', label: 'DebugHandler (2)', sublabel: 'Forwarded', status: 'muted' },
                  { id: 'h3', label: 'ErrorHandler (3)', sublabel: '3 == 3 MATCH!', badge: 'MATCH ✓', status: 'warning' },
                  { id: 's1', label: 'Console + File', sublabel: 'Ready', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Event', value: 'error("DB Timeout")' },
              { label: 'At Handler', value: 'ErrorHandler (lvl 3)', changed: true },
              { label: 'Level Match?', value: '3 == 3 (MATCH!)', changed: true }
            ],
            activeLinesJava: [13, 16, 17],
            activeLinesPy: [15, 18, 19]
          },
          {
            title: 'Step 4: ErrorHandler Publishes Log Packet to Console & File Sinks',
            explanation: 'ErrorHandler matches reqLevel == 3 and iterates over its attached LogSink observers, writing "[3] DB Timeout" to both Console and error.log!',
            status: 'success',
            activeArchNodes: ['err', 'sink'],
            activeArchEdge: { from: 'err', to: 'sink', call: 'sinks.write(msg)' },
            domainGroups: [
              {
                title: 'Handler Chain & Output Sinks',
                layout: 'chain',
                cells: [
                  { id: 'h1', label: 'InfoHandler (1)', status: 'muted' },
                  { id: 'h2', label: 'DebugHandler (2)', status: 'muted' },
                  { id: 'h3', label: 'ErrorHandler (3)', sublabel: 'Published', status: 'success' },
                  { id: 's1', label: 'Console + File', sublabel: '[3] DB Timeout', badge: 'FLUSHED ✓', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Event', value: 'Logged Successfully ✓', changed: true },
              { label: 'Sinks Written', value: 'Console + error.log', changed: true },
              { label: 'Chain End', value: 'next == null' }
            ],
            activeLinesJava: [13, 14],
            activeLinesPy: [15, 16, 17]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 5. ATM MACHINE (6-Step Full Request Lifecycle from Idle Start)
  // ===========================================================================
  'atm-machine': {
    slug: 'atm-machine',
    num: 5,
    title: 'ATM Machine',
    priority: 'Must Know',
    patterns: ['State Pattern (ATM Lifecycle)', 'Chain of Responsibility (Cash Dispenser)'],
    concurrencyNote: 'Pessimistic DB Account Lock + Hardware Session Lock',
    analogy:
      'An ATM starts in IdleState waiting for a card. Each user action transitions the ATM one state forward: Idle → HasCard → PinVerified → Dispensing. Then the Cash Dispenser Chain breaks ₹3,700 across the ₹2000, ₹500, and ₹100 note cassettes.',
    requirements: [
      'State Pattern: IdleState → HasCardState → PinVerifiedState.',
      'Chain of Responsibility Dispenser: ₹2000 → ₹500 → ₹100.',
      'Bank verification and atomic account debit.',
      'Automatic card ejection returning to IdleState.'
    ],
    patternExplanations: [
      {
        pattern: 'State Pattern (ATMState)',
        why: 'Guarantees you cannot enter a PIN before inserting a card or withdraw money before PIN verification.'
      },
      {
        pattern: 'Chain of Responsibility (CashDispenser)',
        why: 'Each cassette dispenses min(amount / denom, available) bills and forwards the remainder to the next smaller cassette.'
      }
    ],
    edgeCases: [
      {
        title: 'ATM lacks exact denominations (e.g., ₹3,000 requested with only two ₹2,000 notes)',
        solution: 'Pre-validate exact change availability across the chain before debiting the user account.'
      }
    ],
    followUps: [
      {
        q: 'How do you handle a hardware jam mid-dispense?',
        a: 'Use a two-phase commit journal: mark debit PENDING until optical exit sensors confirm notes left the tray; otherwise auto-reverse.'
      }
    ],
    archNodes: [
      { id: 'user', label: 'Customer', sublabel: 'Card / PIN / Cash', layer: 'client', x: 110, y: 72 },
      { id: 'atm', label: 'ATM Server', sublabel: 'State Context', layer: 'controller', x: 345, y: 72 },
      { id: 'state', label: 'State Machine', sublabel: 'Idle→Card→PIN', layer: 'pattern', x: 460, y: 172 },
      { id: 'chain', label: 'Note Dispenser', sublabel: '2k · 500 · 100', layer: 'service', x: 645, y: 172 },
      { id: 'bank', label: 'Bank Database', sublabel: 'Auth & Debit', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'user', to: 'atm', label: 'input' },
      { from: 'atm', to: 'state', label: 'transition' },
      { from: 'atm', to: 'bank', label: 'verify/debit' },
      { from: 'state', to: 'chain', label: 'dispense' },
      { from: 'chain', to: 'bank', label: 'audit' }
    ],
    umlClasses: [
      {
        name: 'ATMState',
        stereotype: 'interface',
        role: 'Enforces valid operations at each stage of an ATM session.',
        fields: [],
        methods: ['+ insertCard(atm): void', '+ enterPin(atm, pin): void', '+ withdraw(atm, amt): void']
      },
      {
        name: 'CashDispenser',
        stereotype: 'class',
        role: 'Chain handler for a single bill denomination (₹2000, ₹500, ₹100).',
        fields: ['- denom: int', '- available: int', '- next: CashDispenser'],
        methods: ['+ dispense(amount: int): void']
      }
    ],
    javaCode: [
      'interface ATMState {',
      '    void insertCard(ATM atm);',
      '    void enterPin(ATM atm, int pin);',
      '    void withdraw(ATM atm, int amount);',
      '}',
      'class CashDispenser {',
      '    final int denom; int available; CashDispenser next;',
      '    CashDispenser(int d, int c, CashDispenser n) {',
      '        this.denom = d; this.available = c; this.next = n;',
      '    }',
      '    void dispense(int amount) {',
      '        int notes = Math.min(amount / denom, available);',
      '        int rem = amount - (notes * denom);',
      '        available -= notes;',
      '        if (rem > 0 && next != null) next.dispense(rem);',
      '    }',
      '}',
      'class PinVerifiedState implements ATMState {',
      '    public void withdraw(ATM atm, int amount) {',
      '        atm.bank.debit(amount);',
      '        atm.dispenserChain.dispense(amount);',
      '        atm.setState(new IdleState()); // Eject card',
      '    }',
      '    public void insertCard(ATM a) {} public void enterPin(ATM a, int p) {}',
      '}'
    ],
    pythonCode: [
      'class CashDispenser:',
      '    def __init__(self, denom: int, count: int, nxt=None):',
      '        self.denom = denom',
      '        self.available = count',
      '        self.next = nxt',
      '',
      '    def dispense(self, amount: int) -> None:',
      '        notes = min(amount // self.denom, self.available)',
      '        rem = amount - (notes * self.denom)',
      '        self.available -= notes',
      '        if rem > 0 and self.next:',
      '            self.next.dispense(rem)',
      '',
      'class PinVerifiedState:',
      '    def withdraw(self, atm, amount: int) -> None:',
      '        atm.bank.debit(amount)',
      '        atm.dispenser_chain.dispense(amount)',
      '        atm.set_state(IdleState())  # Eject card'
    ],
    scenarios: [
      {
        id: 'atm-from-idle',
        label: '1. Complete Session: Idle → Insert Card → Verify PIN → Debit DB → Dispense ₹3,700',
        summary: 'Starts from IdleState (no card) and steps through every state transition, bank verification, and note cassette breakdown.',
        steps: [
          {
            title: 'Step 1: Start in IdleState — Customer Inserts Debit Card',
            explanation: 'We start from the beginning: the ATM is in IdleState. Customer inserts their card, sending insertCard() from Customer to ATM Server.',
            status: 'info',
            activeArchNodes: ['user', 'atm', 'state'],
            activeArchEdge: { from: 'user', to: 'atm', call: 'insertCard()' },
            domainGroups: [
              {
                title: 'ATM State Machine & Cash Cassettes',
                layout: 'chain',
                cells: [
                  { id: 's1', label: 'IdleState', sublabel: 'Card Inserted!', badge: 'START', status: 'active' },
                  { id: 's2', label: 'HasCardState', sublabel: 'Transitioning...', status: 'default' },
                  { id: 's3', label: 'PinVerifiedState', sublabel: 'Locked', status: 'muted' },
                  { id: 's4', label: 'Dispense ₹3,700', sublabel: 'Locked', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'ATM State', value: 'Idle → HasCardState', changed: true },
              { label: 'Card Reader', value: 'Card Locked 🔒', changed: true },
              { label: 'Cash Dispensed', value: '₹0' }
            ],
            activeLinesJava: [1, 2],
            activeLinesPy: [14]
          },
          {
            title: 'Step 2: Customer Enters PIN 4321 → Bank Database Verifies Auth',
            explanation: 'In HasCardState, Customer enters PIN 4321. ATM Server sends verifyPin(4321) to Bank Database, which returns OK and moves state to PinVerifiedState.',
            status: 'info',
            activeArchNodes: ['atm', 'bank', 'state'],
            activeArchEdge: { from: 'atm', to: 'bank', call: 'verifyPin(4321)' },
            domainGroups: [
              {
                title: 'ATM State Machine & Cash Cassettes',
                layout: 'chain',
                cells: [
                  { id: 's1', label: 'IdleState', status: 'muted' },
                  { id: 's2', label: 'HasCardState', sublabel: 'PIN Entered', status: 'muted' },
                  { id: 's3', label: 'PinVerifiedState', sublabel: 'PIN Match ✓', badge: 'VERIFIED', status: 'success' },
                  { id: 's4', label: 'Dispense ₹3,700', sublabel: 'Ready', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'ATM State', value: 'PinVerifiedState', changed: true },
              { label: 'Bank Auth', value: 'Approved ✓', changed: true },
              { label: 'Account Bal', value: '₹25,000' }
            ],
            activeLinesJava: [3, 18],
            activeLinesPy: [14]
          },
          {
            title: 'Step 3: Request Withdraw ₹3,700 → Atomic Debit in Bank Database',
            explanation: 'Customer enters ₹3,700. PinVerifiedState first debits ₹3,700 from Bank Database (Balance: ₹25,000 → ₹21,300) before triggering the dispenser chain.',
            status: 'info',
            activeArchNodes: ['user', 'atm', 'bank'],
            activeArchEdge: { from: 'atm', to: 'bank', call: 'debit(₹3700)' },
            domainGroups: [
              {
                title: 'Cash Dispenser Chain (₹2000 → ₹500 → ₹100)',
                layout: 'chain',
                cells: [
                  { id: 'd2000', label: '₹2000 Cassette', sublabel: 'Incoming: ₹3700', badge: 'READY', status: 'active' },
                  { id: 'd500', label: '₹500 Cassette', sublabel: 'Waiting', status: 'default' },
                  { id: 'd100', label: '₹100 Cassette', sublabel: 'Waiting', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Withdraw Req', value: '₹3,700', changed: true },
              { label: 'Account Bal', value: '₹21,300 (Debited)', changed: true },
              { label: 'Dispenser', value: 'Starting Chain...' }
            ],
            activeLinesJava: [19, 20],
            activeLinesPy: [15, 16]
          },
          {
            title: 'Step 4: Note Dispenser Chain Breaks ₹3,700 Across Cassettes',
            explanation: 'State Machine triggers Note Dispenser chain: ₹2000 cassette gives 1 note (rem ₹1,700) → ₹500 gives 3 notes (rem ₹200) → ₹100 gives 2 notes (rem ₹0)!',
            status: 'success',
            activeArchNodes: ['state', 'chain'],
            activeArchEdge: { from: 'state', to: 'chain', call: 'dispense(3700)' },
            domainGroups: [
              {
                title: 'Cash Dispenser Chain (₹2000 → ₹500 → ₹100)',
                layout: 'chain',
                cells: [
                  { id: 'd2000', label: '₹2000 Cassette', sublabel: 'Rem: ₹1,700', badge: '1 × ₹2000', status: 'success' },
                  { id: 'd500', label: '₹500 Cassette', sublabel: 'Rem: ₹200', badge: '3 × ₹500', status: 'success' },
                  { id: 'd100', label: '₹100 Cassette', sublabel: 'Rem: ₹0', badge: '2 × ₹100', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: '₹2000 Notes', value: '1 (₹2,000)', changed: true },
              { label: '₹500 Notes', value: '3 (₹1,500)', changed: true },
              { label: '₹100 Notes', value: '2 (₹200)', changed: true }
            ],
            activeLinesJava: [11, 12, 13, 14, 15, 21],
            activeLinesPy: [7, 8, 9, 10, 11, 12, 17]
          },
          {
            title: 'Step 5: Cash Delivered & Card Ejected → Reset to IdleState',
            explanation: 'ATM Server delivers ₹3,700 cash and ejects the card back to Customer, resetting ATMState to IdleState for the next customer.',
            status: 'success',
            activeArchNodes: ['atm', 'user'],
            activeArchEdge: { from: 'atm', to: 'user', call: 'Eject Card + ₹3700' },
            domainGroups: [
              {
                title: 'ATM Session Complete',
                layout: 'chain',
                cells: [
                  { id: 's1', label: 'IdleState', sublabel: 'Ready for next user', badge: 'RESET ✓', status: 'success' },
                  { id: 's4', label: '₹3,700 Dispensed', sublabel: '6 notes total', badge: 'COLLECTED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'ATM State', value: 'IdleState', changed: true },
              { label: 'Card Status', value: 'Ejected ✓', changed: true },
              { label: 'Total Cash', value: '₹3,700 Delivered' }
            ],
            activeLinesJava: [22],
            activeLinesPy: [18]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 6. SPLITWISE (5-Step Full Request Lifecycle from Start)
  // ===========================================================================
  'splitwise': {
    slug: 'splitwise',
    num: 6,
    title: 'Splitwise',
    priority: 'Must Know',
    patterns: ['Strategy Pattern (Equal / Exact / %)', 'Net Balance Graph Simplification'],
    concurrencyNote: 'Transactional Ledger Append + Optimistic Lock on Group Balance',
    analogy:
      'Instead of everyone paying each other after every meal, Splitwise computes each person’s NET balance (Total Paid minus Total Owed) and matches debtors directly with creditors to settle the group in the fewest transfers.',
    requirements: [
      'Support EQUAL, EXACT, and PERCENT splits via SplitStrategy.',
      'Update per-user Net Balances atomically.',
      'Simplify group debt graph into minimal transfers.'
    ],
    patternExplanations: [
      {
        pattern: 'Strategy Pattern (SplitStrategy)',
        why: 'Separates how equal, exact, and percentage shares are validated and calculated.'
      }
    ],
    edgeCases: [
      {
        title: ' ₹100 split 3 ways (33.33 × 3 = 99.99)',
        solution: 'Assign the 0.01 rounding remainder deterministically to the first participant.'
      }
    ],
    followUps: [
      {
        q: 'How does debt simplification work algorithmically?',
        a: 'Separate users into Creditors (+net) and Debtors (-net) heaps and greedily match the largest debtor with the largest creditor in O(N log N).'
      }
    ],
    archNodes: [
      { id: 'user', label: 'Group Member', sublabel: 'Alice Pays ₹900', layer: 'client', x: 110, y: 72 },
      { id: 'svc', label: 'ExpenseServer', sublabel: 'addExpense()', layer: 'controller', x: 345, y: 72 },
      { id: 'strat', label: 'SplitStrategy', sublabel: 'Equal / Exact / %', layer: 'pattern', x: 460, y: 172 },
      { id: 'simp', label: 'DebtSimplifier', sublabel: 'match min transfers', layer: 'service', x: 645, y: 172 },
      { id: 'ledger', label: 'Ledger DB', sublabel: 'Net Balances', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'user', to: 'svc', label: 'POST' },
      { from: 'svc', to: 'strat', label: 'split(900)' },
      { from: 'svc', to: 'ledger', label: 'update net' },
      { from: 'strat', to: 'simp', label: 'shares' },
      { from: 'simp', to: 'ledger', label: 'settle' }
    ],
    umlClasses: [
      {
        name: 'SplitStrategy',
        stereotype: 'interface',
        role: 'Computes how much each user owes for an expense.',
        fields: [],
        methods: ['+ split(total: double, users: List<String>): Map<String, Double>']
      },
      {
        name: 'SplitwiseService',
        stereotype: 'class',
        role: 'Applies expense shares to the net balance ledger and runs debt simplification.',
        fields: ['- net: Map<String, Double>'],
        methods: ['+ addExpense(paidBy, amt, users, strat): void']
      }
    ],
    javaCode: [
      'interface SplitStrategy {',
      '    Map<String, Double> split(double total, List<String> users);',
      '}',
      'class EqualSplit implements SplitStrategy {',
      '    public Map<String, Double> split(double total, List<String> users) {',
      '        double share = total / users.size();',
      '        Map<String, Double> res = new HashMap<>();',
      '        for (String u : users) res.put(u, share);',
      '        return res;',
      '    }',
      '}',
      'public class SplitwiseService {',
      '    private final Map<String, Double> net = new HashMap<>();',
      '',
      '    public void addExpense(String paidBy, double amt, List<String> users, SplitStrategy strat) {',
      '        Map<String, Double> shares = strat.split(amt, users);',
      '        net.merge(paidBy, amt, Double::sum);',
      '        for (var e : shares.entrySet()) {',
      '            net.merge(e.getKey(), -e.getValue(), Double::sum);',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      'class EqualSplit:',
      '    def split(self, total: float, users: list[str]) -> dict[str, float]:',
      '        share = total / len(users)',
      '        return {u: share for u in users}',
      '',
      'class SplitwiseService:',
      '    def __init__(self):',
      '        self.net: dict[str, float] = {}',
      '',
      '    def add_expense(self, paid_by: str, amt: float, users: list[str], strat) -> None:',
      '        shares = strat.split(amt, users)',
      '        self.net[paid_by] = self.net.get(paid_by, 0.0) + amt',
      '        for user, owed in shares.items():',
      '            self.net[user] = self.net.get(user, 0.0) - owed'
    ],
    scenarios: [
      {
        id: 'full-splitwise-flow',
        label: '1. Complete Flow: ₹0 Balances → Alice Pays ₹900 → Strategy Split → Ledger Update → Simplify',
        summary: 'Starts from ₹0 balances and traces an expense request through EqualSplit, Ledger DB update, and DebtSimplifier.',
        steps: [
          {
            title: 'Step 1: Start (All Balances ₹0) — Alice Submits ₹900 Dinner Expense',
            explanation: 'Everyone starts at ₹0. Alice pays ₹900 for dinner with Bob and Charlie and submits addExpense("Alice", 900, [Alice,Bob,Charlie], EqualSplit).',
            status: 'info',
            activeArchNodes: ['user', 'svc'],
            activeArchEdge: { from: 'user', to: 'svc', call: 'addExpense(₹900)' },
            domainGroups: [
              {
                title: 'Group Net Balances (Initial State)',
                layout: 'row',
                cells: [
                  { id: 'u1', label: 'Alice', sublabel: 'Net: ₹0 → Paying ₹900', badge: 'PAYER', status: 'active' },
                  { id: 'u2', label: 'Bob', sublabel: 'Net: ₹0', status: 'default' },
                  { id: 'u3', label: 'Charlie', sublabel: 'Net: ₹0', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Expense', value: '₹900 by Alice', changed: true },
              { label: 'Split Type', value: 'EQUAL (3 users)' },
              { label: 'Ledger', value: 'All ₹0' }
            ],
            activeLinesJava: [15],
            activeLinesPy: [10]
          },
          {
            title: 'Step 2: ExpenseServer Calls SplitStrategy (₹900 / 3 = ₹300 Each)',
            explanation: 'ExpenseServer delegates share calculation to EqualSplit.split(900, 3), which returns {Alice: 300, Bob: 300, Charlie: 300}.',
            status: 'info',
            activeArchNodes: ['svc', 'strat'],
            activeArchEdge: { from: 'svc', to: 'strat', call: 'split(900, 3) → ₹300' },
            domainGroups: [
              {
                title: 'Computed Per-User Shares (EqualSplit)',
                layout: 'row',
                cells: [
                  { id: 'u1', label: 'Alice Share', sublabel: 'Owes ₹300', badge: '₹300', status: 'active' },
                  { id: 'u2', label: 'Bob Share', sublabel: 'Owes ₹300', badge: '₹300', status: 'active' },
                  { id: 'u3', label: 'Charlie Share', sublabel: 'Owes ₹300', badge: '₹300', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'Formula', value: '900 / 3 = ₹300', changed: true },
              { label: 'Each Share', value: '₹300', changed: true },
              { label: 'Sum Check', value: '₹900 ✓' }
            ],
            activeLinesJava: [5, 6, 7, 8, 9, 16],
            activeLinesPy: [2, 3, 4, 11]
          },
          {
            title: 'Step 3: Persist Net Balances in Ledger DB (+₹600, -₹300, -₹300)',
            explanation: 'ExpenseServer credits Alice +₹900 and subtracts ₹300 from each member in Ledger DB: Alice = +₹600, Bob = -₹300, Charlie = -₹300.',
            status: 'info',
            activeArchNodes: ['svc', 'ledger'],
            activeArchEdge: { from: 'svc', to: 'ledger', call: 'net.merge(shares)' },
            domainGroups: [
              {
                title: 'Updated Net Balances in Ledger DB',
                layout: 'row',
                cells: [
                  { id: 'u1', label: 'Alice', sublabel: '+900 - 300 = +₹600', badge: 'CREDITOR', status: 'success' },
                  { id: 'u2', label: 'Bob', sublabel: '0 - 300 = -₹300', badge: 'DEBTOR', status: 'danger' },
                  { id: 'u3', label: 'Charlie', sublabel: '0 - 300 = -₹300', badge: 'DEBTOR', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'Alice Net', value: '+₹600', changed: true },
              { label: 'Bob Net', value: '-₹300', changed: true },
              { label: 'Charlie Net', value: '-₹300', changed: true }
            ],
            activeLinesJava: [17, 18, 19, 20],
            activeLinesPy: [12, 13, 14]
          },
          {
            title: 'Step 4: DebtSimplifier Pairs Debtors Directly with Creditor',
            explanation: 'DebtSimplifier matches Bob (-₹300) → Alice (+₹600) and Charlie (-₹300) → Alice (+₹300), generating the 2 minimal settlement transfers!',
            status: 'success',
            activeArchNodes: ['strat', 'simp', 'ledger'],
            activeArchEdge: { from: 'simp', to: 'ledger', call: 'simplify() → 2 transfers' },
            domainGroups: [
              {
                title: 'Simplified Settlement Graph',
                layout: 'row',
                cells: [
                  { id: 't1', label: 'Bob ──► Alice', sublabel: 'Transfer ₹300', badge: 'TRANSFER 1', status: 'success' },
                  { id: 't2', label: 'Charlie ──► Alice', sublabel: 'Transfer ₹300', badge: 'TRANSFER 2', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Total Transfers', value: '2 (Minimum)', changed: true },
              { label: 'Bob → Alice', value: '₹300', changed: true },
              { label: 'Charlie → Alice', value: '₹300', changed: true }
            ],
            activeLinesJava: [18, 19, 20],
            activeLinesPy: [13, 14]
          }
        ]
      }
    ]
  }
};
