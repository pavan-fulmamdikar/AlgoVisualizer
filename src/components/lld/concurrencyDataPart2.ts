import type { LLDProblemData } from './lldTypes';

export const CONCURRENCY_PART2: Record<string, LLDProblemData> = {
  // ===========================================================================
  // 9. COMPLETABLEFUTURE & ASYNC COMPOSITION
  // ===========================================================================
  'completablefuture-async': {
    slug: 'completablefuture-async',
    num: 9,
    title: 'CompletableFuture & Async Composition',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Non-Blocking DAG Pipeline', 'thenCompose (FlatMap) vs thenCombine (Join)', 'Custom I/O Executor'],
    concurrencyNote: 'Always Pass a Custom ThreadPool to supplyAsync(fn, ioPool) for Blocking I/O—Never Starve Common ForkJoinPool!',
    analogy:
      'With old Future.get(), ordering a burger (300ms) and fries (300ms) means standing frozen at Counter 1 for 300ms, then walking to Counter 2 and standing frozen for another 300ms (600ms total!). With CompletableFuture, you dispatch two helpers in parallel (supplyAsync) and say: "When BOTH of you finish, combine the burger and fries onto one tray (thenCombine) and handle any kitchen error with a coupon (exceptionally)!"—finishing in 300ms with zero blocked caller threads.',
    requirements: [
      'Compare blocking Future.get() with non-blocking CompletableFuture callback pipelines.',
      'Distinguish thenApply (sync map), thenCompose (dependent async flatMap: A → B(A)), and thenCombine (independent parallel join: A || B → C).',
      'Pass a dedicated Executor for I/O tasks instead of the default ForkJoinPool.commonPool().',
      'Handle errors gracefully with exceptionally() or handle().'
    ],
    patternExplanations: [
      {
        pattern: 'thenCompose() vs thenCombine()',
        why: 'Use thenCompose() when Task B needs Task A’s output (e.g., fetchUserId() → fetchOrders(userId)). Use thenCombine() when Task A and Task B are independent and can run simultaneously in parallel (e.g., fetchProfile() || fetchRecommendations()).'
      },
      {
        pattern: 'Custom Executor for Blocking I/O',
        why: 'By default, supplyAsync() uses ForkJoinPool.commonPool() which has only (N_CPU - 1) threads. Blocking those threads on database/HTTP calls starves the entire JVM!'
      }
    ],
    edgeCases: [
      {
        title: 'thenApply() vs thenApplyAsync()',
        solution: 'thenApply() runs on whichever thread completed the previous stage (or the caller thread if already done). thenApplyAsync() submits the callback as a new task to the executor pool.'
      }
    ],
    followUps: [
      {
        q: 'How do you wait for 10 parallel microservice calls and fail fast or collect results?',
        a: 'Use `CompletableFuture.allOf(futures).thenApply(v -> futures.stream().map(CompletableFuture::join).toList())` with `.orTimeout(800, MILLISECONDS)`.'
      }
    ],
    archNodes: [
      { id: 'caller', label: 'API Thread', sublabel: 'Non-Blocking', layer: 'client', x: 110, y: 72 },
      { id: 'f1', label: 'Future A (User)', sublabel: 'supplyAsync(300ms)', layer: 'controller', x: 345, y: 72 },
      { id: 'f2', label: 'Future B (Orders)', sublabel: 'supplyAsync(300ms)', layer: 'pattern', x: 460, y: 172 },
      { id: 'comb', label: 'thenCombine()', sublabel: 'Join A + B → DTO', layer: 'service', x: 645, y: 172 },
      { id: 'res', label: 'HTTP Response', sublabel: 'Total = 300ms!', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'caller', to: 'f1', label: 'spawn A' },
      { from: 'caller', to: 'f2', label: 'spawn B' },
      { from: 'f1', to: 'comb', label: 'User ready' },
      { from: 'f2', to: 'comb', label: 'Orders ready' },
      { from: 'comb', to: 'res', label: 'exceptionally()' }
    ],
    umlClasses: [
      {
        name: 'thenApply vs thenCompose vs thenCombine',
        stereotype: 'strategy',
        role: 'Core composition operators for building non-blocking async DAGs.',
        fields: [
          'thenApply(T -> U): Synchronous transform (like Stream.map)',
          'thenCompose(T -> CF<U>): Dependent async call (like Stream.flatMap)',
          'thenCombine(CF<V>, (T,V) -> R): Join 2 parallel independent futures'
        ],
        methods: ['+ orTimeout(long, TimeUnit)', '+ exceptionally(Throwable -> T)']
      }
    ],
    javaCode: [
      'import java.util.concurrent.*;',
      '',
      'public class AsyncDashboardService {',
      '    private final ExecutorService ioPool = Executors.newFixedThreadPool(16);',
      '',
      '    public CompletableFuture<String> loadDashboard(String userId) {',
      '        // 1. Launch two independent I/O calls in PARALLEL on custom ioPool',
      '        CompletableFuture<String> userFuture =',
      '            CompletableFuture.supplyAsync(() -> fetchUser(userId), ioPool);',
      '',
      '        CompletableFuture<String> ordersFuture =',
      '            CompletableFuture.supplyAsync(() -> fetchOrders(userId), ioPool);',
      '',
      '        // 2. Join both when ready (300ms total instead of 600ms sequential!)',
      '        return userFuture',
      '            .thenCombine(ordersFuture, (user, orders) -> user + " | " + orders)',
      '            .orTimeout(800, TimeUnit.MILLISECONDS)',
      '            .exceptionally(ex -> "FALLBACK_DASHBOARD");',
      '    }',
      '    private String fetchUser(String id) { return "Alice"; }',
      '    private String fetchOrders(String id) { return "3 Orders"; }',
      '}'
    ],
    pythonCode: [
      'import asyncio',
      '',
      'async def fetch_user(user_id: str) -> str:',
      '    await asyncio.sleep(0.3)',
      '    return "Alice"',
      '',
      'async def fetch_orders(user_id: str) -> str:',
      '    await asyncio.sleep(0.3)',
      '    return "3 Orders"',
      '',
      'async def load_dashboard(user_id: str) -> str:',
      '    try:',
      '        # Runs both coroutines concurrently in 300ms (like thenCombine)',
      '        user, orders = await asyncio.wait_for(',
      '            asyncio.gather(fetch_user(user_id), fetch_orders(user_id)),',
      '            timeout=0.8',
      '        )',
      '        return f"{user} | {orders}"',
      '    except Exception:',
      '        return "FALLBACK_DASHBOARD"'
    ],
    scenarios: [
      {
        id: 'parallel-thencombine',
        label: '1. Parallel Fan-Out & Join: 2×300ms Calls Complete in 300ms via thenCombine()',
        summary: 'Launches fetchUser and fetchOrders in parallel on ioPool and joins them via thenCombine without blocking the API thread.',
        steps: [
          {
            title: 'Step 1: Dispatch userFuture & ordersFuture in Parallel on Custom ioPool',
            explanation: 'API Thread calls supplyAsync(fetchUser, ioPool) and supplyAsync(fetchOrders, ioPool). Both I/O calls run simultaneously while the API Thread returns immediately!',
            status: 'info',
            activeArchNodes: ['caller', 'f1', 'f2'],
            activeArchEdge: { from: 'caller', to: 'f1', call: '2× supplyAsync(..., ioPool)' },
            domainGroups: [
              {
                title: 'Async Pipeline Stages (t = 0ms)',
                layout: 'row',
                cells: [
                  { id: 'a', label: 'Future A: fetchUser', sublabel: 'Running on ioPool-1', badge: '🟢 0..300ms', status: 'active' },
                  { id: 'b', label: 'Future B: fetchOrders', sublabel: 'Running on ioPool-2', badge: '🟢 0..300ms', status: 'active' },
                  { id: 'c', label: 'thenCombine()', sublabel: 'Waiting for A & B', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'API Thread', value: 'Free (Non-Blocked ✓)', changed: true },
              { label: 'In Flight', value: 'Future A || Future B', changed: true }
            ],
            activeLinesJava: [8, 9, 11, 12],
            activeLinesPy: [14, 15]
          },
          {
            title: 'Step 2: Both Complete at t = 300ms → thenCombine() Merges Results into Response',
            explanation: 'At t=300ms, both futures complete. thenCombine() merges ("Alice" + " | " + "3 Orders") in 300ms total latency (2× faster than sequential Future.get()!).',
            status: 'success',
            activeArchNodes: ['f1', 'f2', 'comb', 'res'],
            activeArchEdge: { from: 'comb', to: 'res', call: 'thenCombine → "Alice | 3 Orders"' },
            domainGroups: [
              {
                title: 'Async Pipeline Stages (t = 300ms — 50% Latency Saved!)',
                layout: 'row',
                cells: [
                  { id: 'a', label: 'Future A', sublabel: '"Alice" (300ms)', status: 'success' },
                  { id: 'b', label: 'Future B', sublabel: '"3 Orders" (300ms)', status: 'success' },
                  { id: 'c', label: 'Combined Output', sublabel: '"Alice | 3 Orders"', badge: '✅ 300ms TOTAL', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Sequential Time', value: '600ms' },
              { label: 'Parallel Time', value: '300ms (2× Faster!)', changed: true },
              { label: 'Output', value: '"Alice | 3 Orders"', changed: true }
            ],
            activeLinesJava: [15, 16, 17, 18],
            activeLinesPy: [15, 18]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 10. CONCURRENTHASHMAP & COLLECTIONS
  // ===========================================================================
  'concurrenthashmap-collections': {
    slug: 'concurrenthashmap-collections',
    num: 10,
    title: 'ConcurrentHashMap & Collections',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Lock-Free volatile Reads', 'Empty-Bin CAS Insertion', 'Per-Bin Head Node synchronized Lock', 'Red-Black TreeBin (Threshold 8)'],
    concurrencyNote: 'Java 8+ Removed Segment Locks—Now Uses CAS for Empty Bins + synchronized on Individual Bucket Head Node!',
    analogy:
      'Old Hashtable put a single giant padlock on the entire 16-drawer filing cabinet—if Alice opened Drawer 0, Bob could not even look inside Drawer 15! Java 8+ ConcurrentHashMap puts NO lock on reads (drawers have glass windows via volatile), uses a 1-step atomic CAS snap if a drawer is empty, and only locks the single drawer you are modifying (synchronized on that bucket’s first node) so 16 threads can write to 16 drawers in parallel!',
    requirements: [
      'Explain Java 8+ ConcurrentHashMap architecture: Node[] table with volatile val and volatile next.',
      'get(key) is 100% LOCK-FREE.',
      'put(key, val): If bucket is empty (tabAt(i) == null), insert via lock-free CAS. If bucket is non-empty, synchronize ONLY on the bucket head node f.',
      'Know why null keys and null values are forbidden in ConcurrentHashMap (ambiguity in concurrent get(k) == null).'
    ],
    patternExplanations: [
      {
        pattern: 'Java 8+ Per-Bucket Head Lock + Empty-Bin CAS (vs Java 7 Segments)',
        why: 'Java 7 had 16 fixed ReentrantLock Segments. Java 8+ locks the first Node of each hash bucket (synchronized(f)), scaling concurrency automatically with table size (e.g., 1,024 buckets = 1,024 independent locks!) plus lock-free CAS when a bucket is empty.'
      },
      {
        pattern: 'Why ConcurrentHashMap Forbids null Keys & Values',
        why: 'In a normal HashMap, if get(k) returns null, you can call containsKey(k) to check if k is mapped to null. In a concurrent map, another thread could delete k between containsKey(k) and get(k)!'
      }
    ],
    edgeCases: [
      {
        title: 'Using map.get(k) followed by map.put(k, v + 1) on ConcurrentHashMap',
        solution: 'Calling get() then put() is STILL a race condition! Use atomic compound methods: map.compute(k, (key, old) -> old == null ? 1 : old + 1) or map.merge(k, 1, Integer::sum).'
      }
    ],
    followUps: [
      {
        q: 'How does ConcurrentHashMap track size() without a single bottleneck counter?',
        a: 'Like LongAdder, it maintains a baseCount plus an array of CounterCell[] stripes so concurrent threads increment different cells without contention.'
      }
    ],
    archNodes: [
      { id: 't1', label: 'Thread-1', sublabel: 'put(k1) → Bin[0]', layer: 'client', x: 110, y: 72 },
      { id: 't2', label: 'Thread-2', sublabel: 'put(k2) → Bin[3]', layer: 'controller', x: 345, y: 72 },
      { id: 'cas', label: 'Empty Bin[0]', sublabel: 'casTabAt() Lock-Free', layer: 'pattern', x: 460, y: 172 },
      { id: 'sync', label: 'Bin[3] Head Node', sublabel: 'synchronized(head)', layer: 'service', x: 645, y: 172 },
      { id: 'tab', label: 'Node[] Table', sublabel: 'volatile val/next', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 't1', to: 'cas', label: 'Bin[0] == null' },
      { from: 'cas', to: 'tab', label: 'CAS insert' },
      { from: 't2', to: 'sync', label: 'Bin[3] != null' },
      { from: 'sync', to: 'tab', label: 'lock Bin[3] only' }
    ],
    umlClasses: [
      {
        name: 'ConcurrentHashMap<K, V> (Java 8+)',
        stereotype: 'class',
        role: 'High-throughput concurrent map using lock-free volatile reads, empty-bin CAS, and per-bin head locks.',
        fields: ['transient volatile Node<K,V>[] table', 'private transient volatile CounterCell[] counterCells'],
        methods: [
          '+ get(key): V  // 100% Lock-Free via volatile Node.val',
          '+ put(key, val): V  // CAS if bin empty, else synchronized(binHead)',
          '+ computeIfAbsent(key, fn): V  // Atomic compound update'
        ]
      }
    ],
    javaCode: [
      'import java.util.concurrent.ConcurrentHashMap;',
      '',
      'public class ConcurrentMapDemo {',
      '    private final ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();',
      '',
      '    // ❌ BROKEN Compound Action: get() + put() is NOT atomic even on ConcurrentHashMap!',
      '    public void addBroken(String key) {',
      '        Integer cur = map.get(key);',
      '        map.put(key, cur == null ? 1 : cur + 1); // Race condition between get & put!',
      '    }',
      '',
      '    // ✅ FIXED: merge() / compute() executes atomically inside the bucket head lock!',
      '    public void addSafe(String key) {',
      '        map.merge(key, 1, Integer::sum);',
      '    }',
      '',
      '    // Simplified Java 8+ ConcurrentHashMap.putVal() internals:',
      '    // if ((f = tabAt(tab, i)) == null) -> casTabAt(tab, i, null, new Node(k,v)); // Lock-free!',
      '    // else synchronized (f) { /* chain or TreeBin insert */ }                    // Per-bin lock!',
      '}'
    ],
    pythonCode: [
      'from threading import Lock',
      '',
      '# Sharded Per-Bucket Concurrent Map in Python',
      'class StripedConcurrentMap:',
      '    def __init__(self, num_buckets=16):',
      '        self.buckets = [{} for _ in range(num_buckets)]',
      '        self.locks = [Lock() for _ in range(num_buckets)]',
      '',
      '    def merge_add(self, key: str, delta: int = 1) -> int:',
      '        idx = hash(key) % len(self.buckets)',
      '        with self.locks[idx]:  # Locks ONLY bucket `idx`, other buckets run in parallel!',
      '            val = self.buckets[idx].get(key, 0) + delta',
      '            self.buckets[idx][key] = val',
      '            return val'
    ],
    scenarios: [
      {
        id: 'cas-and-per-bin-lock',
        label: '1. Parallel Writes: T1 Uses Lock-Free CAS on Empty Bin[0] While T2 Locks Only Bin[3] Head',
        summary: 'Shows how Thread-1, Thread-2, and Reader threads operate on different buckets simultaneously with zero global lock contention.',
        steps: [
          {
            title: 'Step 1: Thread-1 Inserts into Empty Bin[0] Using Lock-Free CAS!',
            explanation: 'Thread-1 hashes key1 to Bin[0]. Because tabAt(table, 0) == null, ConcurrentHashMap uses a single hardware CAS (casTabAt) to insert the node with ZERO locks!',
            status: 'info',
            activeArchNodes: ['t1', 'cas', 'tab'],
            activeArchEdge: { from: 'cas', to: 'tab', call: 'Bin[0]==null → casTabAt() ✓' },
            domainGroups: [
              {
                title: 'ConcurrentHashMap Node[] Buckets (Parallel Access)',
                layout: 'row',
                cells: [
                  { id: 'b0', label: 'Bin[0]', sublabel: 'T1: CAS Inserted!', badge: '⚡ LOCK-FREE CAS', status: 'success' },
                  { id: 'b1', label: 'Bin[1]', sublabel: 'Readers: volatile get()', badge: '🟢 LOCK-FREE READ', status: 'default' },
                  { id: 'b3', label: 'Bin[3]', sublabel: '[HeadNode → Node2]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Bin[0] Action', value: 'casTabAt (0 Locks)', changed: true },
              { label: 'Reader Threads', value: '100% Lock-Free' }
            ],
            activeLinesJava: [14, 18],
            activeLinesPy: [10, 11]
          },
          {
            title: 'Step 2: Thread-2 Collides on Non-Empty Bin[3] → Locks ONLY Bin[3] Head Node!',
            explanation: 'At the exact same instant, Thread-2 hashes key2 to Bin[3] (non-empty). It executes synchronized(bin3Head), locking ONLY Bin[3] while Bin[0], Bin[1], Bin[2] remain 100% unblocked!',
            status: 'success',
            activeArchNodes: ['t2', 'sync', 'tab'],
            activeArchEdge: { from: 'sync', to: 'tab', call: 'synchronized(Bin[3].head)' },
            domainGroups: [
              {
                title: 'ConcurrentHashMap Node[] Buckets (Fine-Grained Per-Bin Lock)',
                layout: 'row',
                cells: [
                  { id: 'b0', label: 'Bin[0]', sublabel: 'Unblocked (Free)', badge: '🟢 FREE', status: 'success' },
                  { id: 'b1', label: 'Bin[1]', sublabel: 'Unblocked (Free)', badge: '🟢 FREE', status: 'success' },
                  { id: 'b3', label: 'Bin[3]', sublabel: 'T2 locked head node only', badge: '🔒 BIN[3] LOCK', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'Bin[3] Lock', value: 'Head Node Only 🔒', changed: true },
              { label: 'Other 15 Bins', value: '100% Unblocked ✓', changed: true }
            ],
            activeLinesJava: [13, 14, 19],
            activeLinesPy: [11, 12, 13]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 11. HASHMAP VS CONCURRENTHASHMAP
  // ===========================================================================
  'hashmap-vs-concurrenthashmap': {
    slug: 'hashmap-vs-concurrenthashmap',
    num: 11,
    title: 'HashMap vs ConcurrentHashMap',
    category: 'concurrency',
    priority: 'Advanced',
    patterns: ['Concurrent HashMap Corruption', 'Fail-Fast vs Weakly Consistent Iterators', 'Cooperative Multi-Thread Resize'],
    concurrencyNote: 'Never Share a Plain HashMap Across Threads Without External Synchronization!',
    analogy:
      'Using a plain HashMap across multiple threads is like two librarians simultaneously rearranging the same shelf without talking: one overwrites the other’s book card (Lost Entry), and if anyone is reading the catalog while a shelf is modified, HashMap immediately crashes with ConcurrentModificationException! ConcurrentHashMap uses per-shelf locks, lets multiple threads help resize the cabinet together, and provides Weakly Consistent iterators that never crash.',
    requirements: [
      'Explain the 3 failures of plain HashMap under concurrency: 1) Lost colliding put() updates, 2) Resize corruption (Java 7 circular linked-list 100% CPU infinite loop), 3) Fail-Fast iterator throwing ConcurrentModificationException.',
      'Compare HashMap vs Hashtable vs Collections.synchronizedMap vs ConcurrentHashMap.',
      'Understand Weakly Consistent iterators in ConcurrentHashMap.'
    ],
    patternExplanations: [
      {
        pattern: 'Fail-Fast (HashMap) vs Weakly Consistent (ConcurrentHashMap) Iterators',
        why: 'HashMap checks `modCount != expectedModCount` on every next() call and throws ConcurrentModificationException if any thread modifies the map. ConcurrentHashMap traverses volatile next pointers, reflecting updates without ever throwing ConcurrentModificationException.'
      },
      {
        pattern: 'Cooperative Multi-Threaded Resizing (ForwardingNode)',
        why: 'When ConcurrentHashMap doubles its table size, it places a special ForwardingNode in migrated buckets; any thread that encounters a ForwardingNode during put() automatically pitches in to help copy another slice of buckets to the new table!'
      }
    ],
    edgeCases: [
      {
        title: 'Using HashMap when map is populated at startup and only read afterward',
        solution: 'If a Map is strictly read-only after construction, wrap it in Map.copyOf() (immutable) and publish it safely via a final field—no ConcurrentHashMap overhead needed.'
      }
    ],
    followUps: [
      {
        q: 'Why did Java 7 HashMap cause 100% CPU infinite loops during concurrent resize?',
        a: 'Java 7’s transfer() used head-insertion when moving nodes to the new table, which reversed the bucket linked list order. Two threads resizing at once could create a circular pointer cycle (A.next = B, B.next = A), causing future get() calls to spin forever!'
      }
    ],
    archNodes: [
      { id: 'writers', label: 'T1 & T2 Writers', sublabel: 'Concurrent put()', layer: 'client', x: 110, y: 72 },
      { id: 'hm', label: 'Plain HashMap', sublabel: 'No Locks + modCount++', layer: 'controller', x: 345, y: 72 },
      { id: 'chm', label: 'ConcurrentHashMap', sublabel: 'CAS + Bin Lock', layer: 'pattern', x: 460, y: 172 },
      { id: 'iter', label: 'Iterator Thread', sublabel: 'for(var e : map)', layer: 'service', x: 645, y: 172 },
      { id: 'bucket', label: 'Hash Bucket[i]', sublabel: 'Node Chain', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'writers', to: 'hm', label: 'race on Bin[i]' },
      { from: 'hm', to: 'bucket', label: 'overwrite node!' },
      { from: 'hm', to: 'iter', label: 'CME crash!' },
      { from: 'writers', to: 'chm', label: 'safe put()' },
      { from: 'chm', to: 'bucket', label: 'both saved ✓' }
    ],
    umlClasses: [
      {
        name: 'HashMap (Not Thread-Safe)',
        stereotype: 'class',
        role: 'Fast single-threaded map; corrupts data and throws CME under concurrent writes.',
        fields: ['Locks: None', 'Null Keys/Vals: 1 null key, many null vals', 'Iterator: Fail-Fast (throws CME)'],
        methods: ['Use Only In: Single-threaded or local method scope']
      },
      {
        name: 'Hashtable / synchronizedMap (Legacy)',
        stereotype: 'class',
        role: 'Locks the ENTIRE map on every get() and put(), serializing all threads.',
        fields: ['Locks: 1 Global Map Lock', 'Nulls: Forbidden in Hashtable', 'Iterator: Fail-Fast (must lock externally)'],
        methods: ['Throughput: Poor under multi-core load']
      },
      {
        name: 'ConcurrentHashMap (Modern Production)',
        stereotype: 'strategy',
        role: 'Lock-free reads + per-bucket head locks + cooperative resize.',
        fields: ['Locks: Per-Bucket Head Node + CAS', 'Nulls: Forbidden (neither key nor val)', 'Iterator: Weakly Consistent (never throws CME)'],
        methods: ['Throughput: Scales linearly across CPU cores']
      }
    ],
    javaCode: [
      '// ❌ BROKEN: Concurrent writes to HashMap lose colliding entries & crash iterators!',
      '// In HashMap.putVal():',
      '// if ((p = tab[i]) == null) tab[i] = newNode(hash, key, value, null);',
      '// -> T1 and T2 both see tab[i] == null, and T2 overwrites T1\'s node!',
      '',
      '// ✅ FIXED: ConcurrentHashMap preserves both entries & supports safe iteration',
      'ConcurrentHashMap<String, String> safeMap = new ConcurrentHashMap<>();',
      'safeMap.put("user:1", "Alice");',
      'safeMap.put("user:2", "Bob");',
      '',
      '// Weakly consistent iterator: never throws ConcurrentModificationException',
      'for (var entry : safeMap.entrySet()) {',
      '    safeMap.put("user:3", "Charlie"); // Safe even while iterating!',
      '}'
    ],
    pythonCode: [
      '# In Python, iterating a dict while mutating it raises RuntimeError:',
      '# RuntimeError: dictionary changed size during iteration',
      '',
      'def safe_concurrent_iteration(shared_dict, lock):',
      '    # Snapshot items under lock or use per-stripe locks',
      '    with lock:',
      '        snapshot = list(shared_dict.items())',
      '    for k, v in snapshot:',
      '        print(k, v)'
    ],
    scenarios: [
      {
        id: 'hashmap-corruption-vs-chm',
        label: '❌ Broken: HashMap Colliding put() Overwrite & CME Crash vs ✅ ConcurrentHashMap',
        summary: 'Compares two threads inserting into the same bucket on a plain HashMap (lost node + iterator crash) vs ConcurrentHashMap.',
        steps: [
          {
            title: 'Step 1: ❌ Plain HashMap — T1 & T2 Both See tab[i] == null & Overwrite Each Other!',
            explanation: 'In plain HashMap, T1 and T2 both hash to Bucket[i], both evaluate if (tab[i] == null) as true, and T2 assigns tab[i] = NodeB—completely erasing T1’s NodeA! Meanwhile, an iterator thread crashes with ConcurrentModificationException.',
            status: 'error',
            activeArchNodes: ['writers', 'hm', 'bucket', 'iter'],
            activeArchEdge: { from: 'hm', to: 'bucket', call: 'T2 overwrites tab[i] · Iterator throws CME!' },
            domainGroups: [
              {
                title: 'Plain HashMap Under Concurrent Writes (Data Loss + Crash)',
                layout: 'row',
                cells: [
                  { id: 'n1', label: 'T1: Node("k1")', sublabel: 'Overwritten & Lost!', badge: '❌ LOST DATA', status: 'danger' },
                  { id: 'n2', label: 'Bucket[i]', sublabel: 'Only holds T2 Node("k2")', badge: 'CORRUPTED', status: 'warning' },
                  { id: 'it', label: 'Iterator Thread', sublabel: 'modCount mismatch!', badge: '💥 CME CRASH', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'T1 Entry', value: 'Lost Forever ✗', changed: true },
              { label: 'Iterator', value: 'ConcurrentModificationException', changed: true }
            ],
            activeLinesJava: [2, 3, 4],
            activeLinesPy: [1, 2]
          },
          {
            title: 'Step 2: ✅ ConcurrentHashMap — CAS + Bin Head Lock Chains Both Nodes Safely!',
            explanation: 'In ConcurrentHashMap, T1 wins casTabAt() on empty Bucket[i], and T2 falls back to synchronized(binHead) to chain Node("k2") after Node("k1"). Weakly consistent iterators continue with zero exceptions!',
            status: 'success',
            activeArchNodes: ['writers', 'chm', 'bucket', 'iter'],
            activeArchEdge: { from: 'chm', to: 'bucket', call: 'T1 CAS + T2 Bin Lock → [k1 → k2] ✓' },
            domainGroups: [
              {
                title: 'ConcurrentHashMap Under Concurrent Writes (Zero Loss)',
                layout: 'row',
                cells: [
                  { id: 'b', label: 'Bucket[i] Chain', sublabel: 'Node("k1") → Node("k2")', badge: '✅ BOTH SAVED', status: 'success' },
                  { id: 'it', label: 'Weakly Consistent Iter', sublabel: 'Reads volatile next safely', badge: '✅ NO CME', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Bucket[i]', value: '[k1 → k2] (100% Intact)', changed: true },
              { label: 'Iterator', value: 'Safe Traversal ✓', changed: true }
            ],
            activeLinesJava: [7, 8, 9, 12, 13],
            activeLinesPy: [6, 7, 8]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 12. WEAKHASHMAP
  // ===========================================================================
  'weakhashmap': {
    slug: 'weakhashmap',
    num: 12,
    title: 'WeakHashMap',
    category: 'concurrency',
    priority: 'Specialized',
    patterns: ['WeakReference<Key> Map Entries', 'ReferenceQueue Stale Entry Expunge', 'Auto-Evicting Metadata Cache'],
    concurrencyNote: 'Wrap with Collections.synchronizedMap(new WeakHashMap<>()) When Accessed by Multiple Threads!',
    analogy:
      'In a normal HashMap, putting a key-value pair into the map ties a steel cable (Strong Reference) to the key—even if the rest of your app finishes using that object and sets its variable to null, the HashMap keeps it alive in RAM forever (Memory Leak!). WeakHashMap ties keys with a fragile thread (WeakReference): as soon as no external code holds the key anymore, the Garbage Collector snips the thread and WeakHashMap automatically deletes the entry!',
    requirements: [
      'Understand that WeakHashMap keys are wrapped in WeakReference<K> (values are still held by strong references!).',
      'When a key loses all external strong references, the next GC cycle clears the WeakReference and enqueues it in a ReferenceQueue.',
      'WeakHashMap expunges stale entries automatically on subsequent map operations (get/put/size).',
      'Never use String literals or cached numbers (-128..127) as WeakHashMap keys (they stay strongly referenced in the JVM pool forever!).'
    ],
    patternExplanations: [
      {
        pattern: 'Entry<K,V> extends WeakReference<Object>',
        why: 'Each map entry IS a WeakReference to the key registered with a ReferenceQueue. When GC collects the key, the entry lands in queue, and expungeStaleEntries() unlinks the entry and clears its value.'
      },
      {
        pattern: 'Ideal Use Case: Transient Per-Object Metadata Cache',
        why: 'Attaching extra metadata to objects you do not own (e.g., mapping a ClassLoader, Socket, or Request object to debug context) so the metadata vanishes automatically when the Request object is garbage-collected.'
      }
    ],
    edgeCases: [
      {
        title: 'Value holds a strong reference back to its own Key!',
        solution: 'If Value strongly references Key, the Key is still strongly reachable through the map and will NEVER be garbage-collected! Wrap the Value in a WeakReference too if it references the key.'
      }
    ],
    followUps: [
      {
        q: 'Is WeakHashMap thread-safe by default?',
        a: 'No! Like HashMap, WeakHashMap is unsynchronized. For multi-threaded caches, wrap it with Collections.synchronizedMap(new WeakHashMap<>()) or use Guava/Caffeine CacheBuilder.newBuilder().weakKeys().'
      }
    ],
    archNodes: [
      { id: 'app', label: 'App Variable', sublabel: 'Key k = new Key()', layer: 'client', x: 110, y: 72 },
      { id: 'wmap', label: 'WeakHashMap', sublabel: 'Entry extends WeakRef', layer: 'controller', x: 345, y: 72 },
      { id: 'gc', label: 'JVM Garbage Collector', sublabel: 'Clears Weak Key', layer: 'pattern', x: 460, y: 172 },
      { id: 'rq', label: 'ReferenceQueue', sublabel: 'expungeStaleEntries()', layer: 'service', x: 645, y: 172 },
      { id: 'heap', label: 'JVM Heap Memory', sublabel: 'Key & Value Objects', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'app', to: 'wmap', label: 'k = null' },
      { from: 'wmap', to: 'gc', label: 'weakly reachable' },
      { from: 'gc', to: 'rq', label: 'enqueue Entry' },
      { from: 'rq', to: 'heap', label: 'reclaim RAM' }
    ],
    umlClasses: [
      {
        name: 'HashMap (❌ Retains Unused Keys)',
        stereotype: 'class',
        role: 'Holds a Strong Reference to every Key, preventing GC even after caller sets key = null.',
        fields: ['Key Reference: Strong (Node.key)'],
        methods: ['Result when k = null: Entry stays in RAM forever (Memory Leak)']
      },
      {
        name: 'WeakHashMap (✅ Auto-Reclaimed on GC)',
        stereotype: 'strategy',
        role: 'Holds a WeakReference to each Key and purges entries via ReferenceQueue after GC.',
        fields: ['Key Reference: Weak (Entry extends WeakReference<K>)'],
        methods: ['Result when k = null: GC collects key & map purges entry automatically']
      }
    ],
    javaCode: [
      'import java.util.WeakHashMap;',
      '',
      'public class MetadataCache {',
      '    public static void main(String[] args) {',
      '        WeakHashMap<Object, String> cache = new WeakHashMap<>();',
      '        Object requestKey = new Object(); // Strong reference held by local var',
      '',
      '        cache.put(requestKey, "UserSession_Metadata");',
      '        System.out.println("Before null: size = " + cache.size()); // 1',
      '',
      '        // Drop the ONLY external strong reference to requestKey:',
      '        requestKey = null;',
      '',
      '        // Next GC cycle sees requestKey is only weakly reachable & reclaims it!',
      '        System.gc();',
      '        // cache.expungeStaleEntries() runs automatically on size() / get():',
      '        System.out.println("After GC: size = " + cache.size());    // 0 (Freed!)',
      '    }',
      '}'
    ],
    pythonCode: [
      'import gc',
      'import weakref',
      '',
      'class RequestContext: pass',
      '',
      'cache = weakref.WeakKeyDictionary()',
      'req_key = RequestContext()',
      'cache[req_key] = "UserSession_Metadata"',
      'print("Before del:", len(cache))  # 1',
      '',
      'req_key = None  # Drop strong reference',
      'gc.collect()',
      'print("After GC:", len(cache))    # 0 (Automatically removed!)'
    ],
    scenarios: [
      {
        id: 'weakhashmap-gc-reclaim',
        label: '1. Complete Lifecycle: Put Key → Drop Strong Ref (k = null) → GC Cycle → ReferenceQueue Purges Entry',
        summary: 'Traces how dropping the external strong reference allows GC and ReferenceQueue to automatically purge the WeakHashMap entry.',
        steps: [
          {
            title: 'Step 1: Put(requestKey, "Metadata") While App Holds Strong Reference',
            explanation: 'App Variable holds a Strong Reference to requestKey, while WeakHashMap holds only a dashed WeakReference to requestKey. Size is 1.',
            status: 'info',
            activeArchNodes: ['app', 'wmap', 'heap'],
            activeArchEdge: { from: 'app', to: 'wmap', call: 'cache.put(requestKey, "Meta")' },
            domainGroups: [
              {
                title: 'Reachability Graph in JVM Heap',
                layout: 'row',
                cells: [
                  { id: 's', label: 'App Var: requestKey', sublabel: 'Strong Ref ━━► Key', badge: 'STRONG REF', status: 'active' },
                  { id: 'w', label: 'WeakHashMap Entry', sublabel: 'Weak Ref ╌╌► Key', badge: 'SIZE = 1', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Strong Refs', value: '1 (requestKey)' },
              { label: 'Weak Refs', value: '1 (Map Entry)' },
              { label: 'Map Size', value: '1' }
            ],
            activeLinesJava: [5, 6, 8, 9],
            activeLinesPy: [6, 7, 8, 9]
          },
          {
            title: 'Step 2: App Sets requestKey = null → Key Is Now Only Weakly Reachable!',
            explanation: 'When the request finishes, App sets requestKey = null. Now zero strong references point to the Key object—only WeakHashMap’s WeakReference remains!',
            status: 'warning',
            activeArchNodes: ['app', 'wmap', 'gc'],
            activeArchEdge: { from: 'wmap', to: 'gc', call: 'requestKey = null (0 Strong Refs!)' },
            domainGroups: [
              {
                title: 'Reachability Graph After requestKey = null',
                layout: 'row',
                cells: [
                  { id: 's', label: 'App Var: requestKey', sublabel: 'null (Broken!)', badge: '0 STRONG REFS', status: 'muted' },
                  { id: 'w', label: 'Key Object on Heap', sublabel: 'Only Weakly Reachable', badge: 'GC ELIGIBLE', status: 'warning' }
                ]
              }
            ],
            stateChips: [
              { label: 'Strong Refs', value: '0 (Dropped!)', changed: true },
              { label: 'Reachability', value: 'Weakly Reachable', changed: true }
            ],
            activeLinesJava: [12],
            activeLinesPy: [11]
          },
          {
            title: 'Step 3: GC Reclaims Key & ReferenceQueue Expunges Stale Map Entry (Size → 0)!',
            explanation: 'JVM Garbage Collector reclaims the Key object and pushes the Entry into ReferenceQueue. WeakHashMap.expungeStaleEntries() removes the entry and frees the value!',
            status: 'success',
            activeArchNodes: ['gc', 'rq', 'heap'],
            activeArchEdge: { from: 'rq', to: 'heap', call: 'expungeStaleEntries() → size = 0 ✓' },
            domainGroups: [
              {
                title: 'JVM Heap After GC & ReferenceQueue Expunge',
                layout: 'row',
                cells: [
                  { id: 'g', label: 'Key Object', sublabel: 'Collected by GC', badge: '♻️ FREED', status: 'success' },
                  { id: 'm', label: 'WeakHashMap', sublabel: 'Stale entry purged', badge: '✅ SIZE = 0', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'GC Action', value: 'Key Collected ♻️', changed: true },
              { label: 'Map Size', value: '0 (Zero Memory Leak ✓)', changed: true }
            ],
            activeLinesJava: [15, 17],
            activeLinesPy: [12, 13]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 13. WEAK / SOFT / PHANTOM REFERENCE
  // ===========================================================================
  'weak-soft-phantom-reference': {
    slug: 'weak-soft-phantom-reference',
    num: 13,
    title: 'Weak / Soft / Phantom Reference',
    category: 'concurrency',
    priority: 'Specialized',
    patterns: ['4 JVM Reference Strengths', 'Memory-Sensitive Soft Cache', 'PhantomReference Post-Mortem Cleanup'],
    concurrencyNote: 'PhantomReference.get() ALWAYS Returns null—It Replaces Broken Object.finalize()!',
    analogy:
      'Think of 4 tiers of hotel guests when the hotel manager (Garbage Collector) does a room sweep: 1) Strong Reference (VIP Owner): NEVER evicted, even if the hotel runs out of rooms (throws OutOfMemoryError instead). 2) Soft Reference (Long-Stay Guest): Allowed to stay during normal sweeps, and ONLY evicted if the hotel is almost out of rooms (OutOfMemory is imminent). 3) Weak Reference (Couch Surfer): Evicted on the very next sweep as soon as no VIP Owner vouches for them. 4) Phantom Reference (Checkout Receipt): You cannot talk to the guest anymore (get() == null)—it just drops a receipt in ReferenceQueue after they leave so you can clean up off-heap native memory!',
    requirements: [
      'Compare all 4 reference types in java.lang.ref: Strong, SoftReference, WeakReference, PhantomReference.',
      'Know exactly WHEN the GC collects each type (Never vs Memory Pressure vs Next GC vs Post-Finalization).',
      'Understand why PhantomReference + ReferenceQueue (or Java 9 Cleaner) replaced Object.finalize().'
    ],
    patternExplanations: [
      {
        pattern: 'SoftReference vs WeakReference',
        why: 'WeakReference is collected eagerly on the very next Minor GC. SoftReference is retained across GC cycles as long as heap memory is plentiful, and cleared only right before the JVM would throw OutOfMemoryError—making SoftReference useful for memory-sensitive image/data caches.'
      },
      {
        pattern: 'PhantomReference (Safe Off-Heap Resource Cleanup)',
        why: 'Object.finalize() was dangerous because a finalizer could resurrect a dead object (`globalRef = this`). PhantomReference.get() always returns null (so resurrection is impossible!) and enqueues into ReferenceQueue only after the object is unreachable, letting DirectByteBuffer free native C++ memory safely.'
      }
    ],
    edgeCases: [
      {
        title: 'ThreadLocal internal memory leak via WeakReference',
        solution: 'ThreadLocalMap Entry extends WeakReference<ThreadLocal<?>>. If a ThreadLocal variable becomes null, the key is GC’d, but the Entry value stays in the pooled thread until you call threadLocal.remove()!'
      }
    ],
    followUps: [
      {
        q: 'Why does PhantomReference require a ReferenceQueue in its constructor?',
        a: 'Because PhantomReference.get() unconditionally returns null! Without a ReferenceQueue to poll/await when the referent is collected, a PhantomReference would be completely useless.'
      }
    ],
    archNodes: [
      { id: 'strong', label: '1. Strong Ref', sublabel: 'Object o = new()', layer: 'client', x: 110, y: 72 },
      { id: 'soft', label: '2. SoftReference', sublabel: 'Cleared if RAM Full', layer: 'controller', x: 345, y: 72 },
      { id: 'weak', label: '3. WeakReference', sublabel: 'Cleared on Next GC', layer: 'pattern', x: 460, y: 172 },
      { id: 'phantom', label: '4. PhantomRef', sublabel: 'get()==null + Queue', layer: 'service', x: 645, y: 172 },
      { id: 'gc', label: 'GC & RefQueue', sublabel: 'Minor GC vs Full RAM', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'strong', to: 'soft', label: 'survives GC' },
      { from: 'soft', to: 'weak', label: 'normal GC' },
      { from: 'weak', to: 'gc', label: 'collected!' },
      { from: 'weak', to: 'phantom', label: 'post-mortem' },
      { from: 'phantom', to: 'gc', label: 'free off-heap' }
    ],
    umlClasses: [
      {
        name: '1. Strong Reference (Default)',
        stereotype: 'class',
        role: 'Standard variable assignment (`Object obj = new Object()`).',
        fields: ['GC Rule: NEVER collected while reachable'],
        methods: ['Under Full RAM: Throws OutOfMemoryError']
      },
      {
        name: '2. SoftReference<T>',
        stereotype: 'strategy',
        role: 'Memory-sensitive cache reference; survives normal GC when heap has free space.',
        fields: ['GC Rule: Collected ONLY when JVM heap is nearly full (before OOM)'],
        methods: ['+ get(): T (returns object until low-memory GC clears it)']
      },
      {
        name: '3. WeakReference<T>',
        stereotype: 'strategy',
        role: 'Eagerly collected on the very next GC cycle once strong refs are gone.',
        fields: ['GC Rule: Collected immediately on next GC pass'],
        methods: ['Used In: WeakHashMap, ThreadLocalMap keys']
      },
      {
        name: '4. PhantomReference<T>',
        stereotype: 'state',
        role: 'Post-mortem notification hook into ReferenceQueue; cannot access object.',
        fields: ['GC Rule: Enqueued after object is finalized & unreachable'],
        methods: ['+ get(): ALWAYS returns null (prevents object resurrection)']
      }
    ],
    javaCode: [
      'import java.lang.ref.*;',
      '',
      'public class ReferenceTypesDemo {',
      '    public static void main(String[] args) {',
      '        // 1. Strong: Never collected while variable points to it',
      '        Object strong = new Object();',
      '',
      '        // 2. Soft: Survives normal GC; cleared ONLY if JVM is low on memory',
      '        SoftReference<byte[]> softCache = new SoftReference<>(new byte[1024]);',
      '',
      '        // 3. Weak: Collected eagerly on the VERY NEXT GC cycle',
      '        WeakReference<Object> weakMeta = new WeakReference<>(new Object());',
      '',
      '        // 4. Phantom: get() is ALWAYS null; enqueued in refQueue for off-heap cleanup',
      '        ReferenceQueue<Object> refQueue = new ReferenceQueue<>();',
      '        PhantomReference<Object> phantom = new PhantomReference<>(new Object(), refQueue);',
      '        System.out.println(phantom.get()); // Always prints: null',
      '    }',
      '}'
    ],
    pythonCode: [
      'import weakref',
      '',
      'class NativeBuffer: pass',
      '',
      'buf = NativeBuffer()',
      '# 1. Weak reference (like Java WeakReference)',
      'w_ref = weakref.ref(buf)',
      '',
      '# 2. Post-mortem finalizer callback (like Java PhantomReference / Cleaner)',
      'finalizer = weakref.finalize(buf, lambda: print("Freed off-heap C memory!"))',
      '',
      'buf = None  # Triggers finalizer on GC without resurrecting `buf`'
    ],
    scenarios: [
      {
        id: 'gc-sweep-comparison',
        label: '1. Compare All 4 Under Normal Minor GC vs Low-Memory Full GC',
        summary: 'Steps through a Normal GC sweep (where Weak is collected but Soft survives) followed by a Low-Memory sweep (where Soft is cleared before OOM).',
        steps: [
          {
            title: 'Step 1: Normal Minor GC Runs (Plenty of Free RAM) → Weak Collected, Soft Survives!',
            explanation: 'During a normal GC pass with plenty of free heap: Strong survives, SoftReference SURVIVES (keeping cached data warm!), WeakReference is immediately collected, and PhantomReference is enqueued in ReferenceQueue.',
            status: 'info',
            activeArchNodes: ['strong', 'soft', 'weak', 'gc'],
            activeArchEdge: { from: 'weak', to: 'gc', call: 'Normal GC: Weak cleared · Soft kept!' },
            domainGroups: [
              {
                title: 'Status of All 4 Reference Types After Normal GC (Free RAM Available)',
                layout: 'row',
                cells: [
                  { id: 'r1', label: '1. Strong Ref', sublabel: 'get() != null', badge: '✅ KEPT', status: 'success' },
                  { id: 'r2', label: '2. SoftReference', sublabel: 'get() != null (RAM OK)', badge: '✅ KEPT IN RAM', status: 'success' },
                  { id: 'r3', label: '3. WeakReference', sublabel: 'get() == null!', badge: '♻️ COLLECTED', status: 'warning' },
                  { id: 'r4', label: '4. PhantomRef', sublabel: 'get() == null → RefQueue', badge: '📬 ENQUEUED', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'Heap Pressure', value: 'Low (40% Used)' },
              { label: 'SoftReference', value: 'Alive ✓', changed: true },
              { label: 'WeakReference', value: 'Cleared (null) ♻️', changed: true }
            ],
            activeLinesJava: [6, 9, 12, 16],
            activeLinesPy: [7, 10]
          },
          {
            title: 'Step 2: Heap Reaches 98% Capacity → GC Clears SoftReference to Prevent OutOfMemoryError!',
            explanation: 'When heap memory runs critically low, the GC sweeps SoftReferences and reclaims their memory right before throwing OutOfMemoryError. Strong references remain untouched.',
            status: 'success',
            activeArchNodes: ['soft', 'phantom', 'gc'],
            activeArchEdge: { from: 'phantom', to: 'gc', call: 'Low RAM: Soft cleared · Off-heap freed ✓' },
            domainGroups: [
              {
                title: 'Status Under High Memory Pressure (98% Heap Full)',
                layout: 'row',
                cells: [
                  { id: 'r1', label: '1. Strong Ref', sublabel: 'Never collected', badge: '🔒 PROTECTED', status: 'active' },
                  { id: 'r2', label: '2. SoftReference', sublabel: 'Cleared to prevent OOM!', badge: '♻️ RECLAIMED', status: 'success' },
                  { id: 'r3', label: '3. WeakReference', sublabel: 'Already null', status: 'muted' },
                  { id: 'r4', label: '4. Phantom Cleaner', sublabel: 'Native off-heap freed', badge: '✅ CLEANED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Heap Pressure', value: 'Critical (98%)', changed: true },
              { label: 'SoftReference', value: 'Cleared to save JVM ✓', changed: true },
              { label: 'OOM Prevented', value: 'Yes ✓', changed: true }
            ],
            activeLinesJava: [9, 15, 16, 17],
            activeLinesPy: [10, 12]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 14. VIRTUAL THREADS (JAVA 21)
  // ===========================================================================
  'virtual-threads': {
    slug: 'virtual-threads',
    num: 14,
    title: 'Virtual Threads (Java 21)',
    category: 'concurrency',
    priority: 'Advanced',
    patterns: ['Project Loom M:N Scheduling', 'Carrier Thread (ForkJoinPool)', 'Continuation Mount / Unmount on Blocking I/O'],
    concurrencyNote: 'Virtual Threads Are Cheap (~1 KB Stack vs 1 MB OS Thread)—Never Pool Virtual Threads!',
    analogy:
      'A classic Platform Thread is like a taxi driver who drives you to the airport and then sits parked at the curb for 3 hours waiting for your flight (Blocking I/O)—wasting the whole car! A Java 21 Virtual Thread is like Uber: the Carrier Thread (car) drops Virtual Thread 1 off at the database wait-gate, immediately UNMOUNTS Virtual Thread 1 onto the heap, and drives off to run Virtual Thread 2! As soon as the database responds, any free Carrier Thread picks Virtual Thread 1 back up and continues right where it left off.',
    requirements: [
      'Compare 1:1 Platform Threads (~1 MB OS stack, max ~4,000 threads) with M:N Virtual Threads (~1 KB heap continuation stack, millions of threads).',
      'Understand Mount → Blocking I/O Unmount → Heap Continuation → Remount on ForkJoinPool Carrier Threads.',
      'Know the 2 best practices: 1) NEVER pool Virtual Threads (use Executors.newVirtualThreadPerTaskExecutor()), 2) Avoid Thread Pinning inside long synchronized blocks doing I/O (use ReentrantLock instead).'
    ],
    patternExplanations: [
      {
        pattern: 'Continuation Unmounting on Blocking I/O',
        why: 'When a Virtual Thread calls Socket.read() or JDBC query, the JVM saves its stack frames into a tiny Continuation object on the heap and unmounts it from the OS Carrier Thread—freeing the OS thread to execute other virtual threads at 100% CPU utilization.'
      },
      {
        pattern: 'Thread Pinning Hazard (synchronized + I/O)',
        why: 'In Java 21, if a Virtual Thread performs blocking I/O while inside a `synchronized` block or native JNI frame, it gets PINNED to its OS Carrier Thread and cannot unmount. Replace `synchronized` around I/O calls with `ReentrantLock`!'
      }
    ],
    edgeCases: [
      {
        title: 'Using Virtual Threads for pure CPU-bound math (e.g., video encoding / sorting)',
        solution: 'Virtual Threads only speed up high-concurrency I/O-bound workloads (waiting on DB/HTTP). They do NOT make CPU-bound loops run faster than platform threads.'
      }
    ],
    followUps: [
      {
        q: 'Why should you NEVER pool Virtual Threads or cache expensive objects in ThreadLocal with them?',
        a: 'Virtual Threads are disposable (1 million created and destroyed per second). Pooling them adds contention overhead, and storing heavy objects in ThreadLocal across 1 million virtual threads will blow up heap RAM!'
      }
    ],
    archNodes: [
      { id: 'vt', label: '100k VirtualThreads', sublabel: 'Thread.startVirtual()', layer: 'client', x: 110, y: 72 },
      { id: 'carrier', label: 'OS Carrier Thread', sublabel: 'ForkJoinPool Worker', layer: 'controller', x: 345, y: 72 },
      { id: 'cont', label: 'Heap Continuation', sublabel: 'Unmount on I/O Wait', layer: 'pattern', x: 460, y: 172 },
      { id: 'poller', label: 'OS epoll / kqueue', sublabel: 'Socket Ready Event', layer: 'service', x: 645, y: 172 },
      { id: 'db', label: 'Database / HTTP', sublabel: '50ms Network I/O', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'vt', to: 'carrier', label: '1. mount' },
      { from: 'carrier', to: 'db', label: '2. start I/O' },
      { from: 'carrier', to: 'cont', label: '3. unmount!' },
      { from: 'db', to: 'poller', label: '4. data ready' },
      { from: 'poller', to: 'carrier', label: '5. remount' }
    ],
    umlClasses: [
      {
        name: 'Platform Thread (1:1 OS Thread)',
        stereotype: 'class',
        role: 'Heavyweight wrapper around an OS kernel thread.',
        fields: ['Memory: ~1 MB reserved stack', 'Max Count: ~4,000 before OS thrashing', 'On Blocking I/O: OS thread sleeps & wastes kernel slot'],
        methods: ['Thread.ofPlatform().start(task)']
      },
      {
        name: 'Virtual Thread (M:N Project Loom)',
        stereotype: 'strategy',
        role: 'Lightweight JVM-managed thread backed by a resizable heap Continuation.',
        fields: ['Memory: ~1 KB on JVM Heap', 'Max Count: 1,000,000+ concurrent threads', 'On Blocking I/O: Unmounts from Carrier in nanoseconds!'],
        methods: ['Executors.newVirtualThreadPerTaskExecutor()']
      }
    ],
    javaCode: [
      'import java.util.concurrent.Executors;',
      'import java.util.concurrent.locks.ReentrantLock;',
      '',
      'public class VirtualThreadServer {',
      '    // Use ReentrantLock instead of `synchronized` around I/O to avoid Carrier Pinning!',
      '    private final ReentrantLock ioLock = new ReentrantLock();',
      '',
      '    public void handle100kRequests() {',
      '        // Never pool Virtual Threads! Create a fresh one per request:',
      '        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {',
      '            for (int i = 0; i < 100_000; i++) {',
      '                executor.submit(() -> {',
      '                    // When fetchFromDb() blocks on socket I/O:',
      '                    // JVM UNMOUNTS this VirtualThread from the OS Carrier Thread!',
      '                    String data = fetchFromDb();',
      '                    return process(data);',
      '                });',
      '            }',
      '        }',
      '    }',
      '    private String fetchFromDb() { return "row"; }',
      '    private String process(String s) { return s; }',
      '}'
    ],
    pythonCode: [
      'import asyncio',
      '',
      '# Python asyncio coroutines similarly yield the OS thread on `await` I/O:',
      'async def handle_request(req_id: int) -> str:',
      '    # Unmounts from event loop while waiting on network socket:',
      '    await asyncio.sleep(0.05)',
      '    return f"Result {req_id}"',
      '',
      'async def main():',
      '    tasks = [handle_request(i) for i in range(100_000)]',
      '    await asyncio.gather(*tasks)'
    ],
    scenarios: [
      {
        id: 'mount-unmount-remount',
        label: '1. Complete Loom Lifecycle: Mount VT-1 → Hit DB I/O → Unmount to Heap & Run VT-2 → Remount VT-1',
        summary: 'Traces how a single OS Carrier Thread runs multiple Virtual Threads concurrently by unmounting on blocking I/O.',
        steps: [
          {
            title: 'Step 1: Mount VirtualThread-1 onto OS Carrier Thread & Issue DB Query',
            explanation: 'VirtualThread-1 is mounted onto Carrier-Thread-1 (an OS thread in ForkJoinPool) and sends a 50ms SQL query to Database.',
            status: 'info',
            activeArchNodes: ['vt', 'carrier', 'db'],
            activeArchEdge: { from: 'carrier', to: 'db', call: 'VT-1 mounted → socket.read()' },
            domainGroups: [
              {
                title: 'OS Carrier Thread & JVM Heap Continuations',
                layout: 'row',
                cells: [
                  { id: 'c', label: 'OS Carrier-Thread-1', sublabel: 'Running VT-1', badge: '🟢 MOUNTED: VT-1', status: 'active' },
                  { id: 'h', label: 'Heap Continuations', sublabel: '[ VT-2 Ready ]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Carrier-1', value: 'Mounted VT-1', changed: true },
              { label: 'VT-1 Action', value: 'Socket Read (50ms I/O)' }
            ],
            activeLinesJava: [10, 12, 15],
            activeLinesPy: [4, 6]
          },
          {
            title: 'Step 2: Blocking I/O Detected → JVM Unmounts VT-1 to Heap & Mounts VT-2 Immediately!',
            explanation: 'Instead of blocking the OS thread for 50ms, the JVM saves VT-1’s stack frames to Heap Continuation, unmounts VT-1, and immediately mounts VT-2 onto Carrier-Thread-1!',
            status: 'success',
            activeArchNodes: ['carrier', 'cont', 'vt'],
            activeArchEdge: { from: 'carrier', to: 'cont', call: 'Unmount VT-1 → Mount VT-2!' },
            domainGroups: [
              {
                title: 'OS Carrier Thread Never Blocks on I/O!',
                layout: 'row',
                cells: [
                  { id: 'c', label: 'OS Carrier-Thread-1', sublabel: 'Now Running VT-2 (100% CPU!)', badge: '🟢 MOUNTED: VT-2', status: 'success' },
                  { id: 'h', label: 'Heap Continuation', sublabel: 'VT-1 Parked (~1 KB RAM)', badge: '⏸️ UNMOUNTED', status: 'warning' }
                ]
              }
            ],
            stateChips: [
              { label: 'VT-1 State', value: 'Unmounted on Heap (~1KB)', changed: true },
              { label: 'Carrier-1', value: 'Running VT-2 (Zero Idle!)', changed: true }
            ],
            activeLinesJava: [14, 15],
            activeLinesPy: [6]
          },
          {
            title: 'Step 3: DB Socket Responds → OS Poller Schedules VT-1 to Remount & Finish!',
            explanation: 'When Database bytes arrive, OS epoll wakes VT-1’s Continuation and mounts it onto an available Carrier Thread to execute line 16 (process(data)) seamlessly!',
            status: 'success',
            activeArchNodes: ['db', 'poller', 'carrier'],
            activeArchEdge: { from: 'poller', to: 'carrier', call: 'I/O Ready → Remount VT-1 ✓' },
            domainGroups: [
              {
                title: 'VirtualThread-1 Remounted & Completed',
                layout: 'row',
                cells: [
                  { id: 'c', label: 'OS Carrier-Thread', sublabel: 'Remounted VT-1 → Done!', badge: '✅ VT-1 COMPLETED', status: 'success' },
                  { id: 'h', label: 'Throughput', sublabel: '100,000 reqs on 8 OS threads', badge: '🚀 100K CONCURRENT', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'VT-1 Status', value: 'Remounted & Completed ✓', changed: true },
              { label: 'OS Threads Used', value: 'Only 8 Cores for 100k Tasks!' }
            ],
            activeLinesJava: [15, 16],
            activeLinesPy: [6, 7]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 15. JVM / GC OVERVIEW
  // ===========================================================================
  'jvm-gc-overview': {
    slug: 'jvm-gc-overview',
    num: 15,
    title: 'JVM / GC Overview',
    category: 'concurrency',
    priority: 'Advanced',
    patterns: ['Weak Generational Hypothesis', 'Eden → Survivor S0/S1 → Old Gen Promotion', 'GC Roots & Reachability Analysis'],
    concurrencyNote: '95% of Objects Die Young in Eden—Minor GC Uses Fast Copying (Zero Fragmentation)!',
    analogy:
      'Think of JVM Heap memory as a company talent pipeline based on one truth (The Weak Generational Hypothesis: 95% of objects die within milliseconds!): 1) All new objects start in the Nursery (Eden Space). 2) When Eden fills up, a fast Minor GC sweeps through: dead objects are wiped instantly, and the few survivors are copied to Survivor S0 (age = 1). 3) Objects bounce between S0 and S1 on each Minor GC, aging +1 each time. 4) Once an object survives 15 rounds (Tenuring Threshold), it earns tenure in the Old Generation!',
    requirements: [
      'Understand JVM Heap layout: Young Generation (Eden + Survivor S0 + Survivor S1) and Old / Tenured Generation.',
      'Explain why there are TWO Survivor spaces (S0 and S1): Minor GC copies live objects from Eden + FromSpace into contiguous ToSpace, eliminating fragmentation in O(Live Objects) time!',
      'Know what qualifies as a GC Root: Active Thread Stack Local Variables, Static Fields, Active JNI References, Synchronized Monitor Objects.',
      'Compare G1GC (Default: region-based predictable pause target) vs ZGC (Sub-millisecond colored-pointer concurrent GC).'
    ],
    patternExplanations: [
      {
        pattern: 'Why Two Survivor Spaces (S0 and S1)?',
        why: 'If Minor GC swept Eden in-place, free memory would look like Swiss cheese (fragmented). By evacuating the tiny ~5% of live objects from Eden + S0 into an empty S1 space side-by-side, S1 stays 100% compact and Eden + S0 can be reset to empty in O(1) pointer bump!'
      },
      {
        pattern: 'GC Roots Reachability vs Reference Counting',
        why: 'Reference counting cannot collect circular references (A → B → A). JVM GC traces outward from GC Roots (Thread Stacks + Static Variables); any isolated island not reachable from a GC Root is reclaimed even if it has internal cycles!'
      }
    ],
    edgeCases: [
      {
        title: 'Humongous Object Allocation (e.g., byte[50MB] larger than 50% of a G1 region)',
        solution: 'G1GC bypasses Eden and allocates Humongous objects directly in contiguous Old Gen regions to avoid expensive copying during Minor GC.'
      }
    ],
    followUps: [
      {
        q: 'How do you diagnose a Memory Leak in a production Java service?',
        a: 'Capture a heap dump on OOM (`-XX:+HeapDumpOnOutOfMemoryError` or `jmap -dump:live`) and inspect the Dominator Tree in Eclipse MAT to find which GC Root (usually a static Map or unclosed ThreadLocal) retains the largest shallow/retained heap.'
      }
    ],
    archNodes: [
      { id: 'alloc', label: 'new Object()', sublabel: 'TLAB Pointer Bump', layer: 'client', x: 110, y: 72 },
      { id: 'eden', label: '1. Eden Space', sublabel: 'Young Gen Nursery', layer: 'controller', x: 345, y: 72 },
      { id: 'surv', label: '2. Survivor S0 ⇄ S1', sublabel: 'Copy & Age++ (1..15)', layer: 'pattern', x: 460, y: 172 },
      { id: 'old', label: '3. Old Gen (Tenured)', sublabel: 'Age >= 15 / G1 Mixed', layer: 'service', x: 645, y: 172 },
      { id: 'roots', label: 'GC Roots Tracer', sublabel: 'Stack + Static Refs', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'alloc', to: 'eden', label: 'allocate' },
      { from: 'eden', to: 'surv', label: 'Minor GC copy' },
      { from: 'surv', to: 'old', label: 'promote age 15' },
      { from: 'old', to: 'roots', label: 'Concurrent Mark' }
    ],
    umlClasses: [
      {
        name: '1. Young Generation (Eden + S0 + S1)',
        stereotype: 'class',
        role: 'Where all new objects are allocated via ultra-fast Thread-Local Allocation Buffers (TLAB).',
        fields: ['Eden: New allocations', 'Survivor S0 / S1: One active, one empty target for copying'],
        methods: ['Collected By: Minor GC (Fast Copying Algorithm in ~5-15ms)']
      },
      {
        name: '2. Old Generation (Tenured)',
        stereotype: 'class',
        role: 'Holds long-lived objects promoted after surviving N Minor GC cycles.',
        fields: ['Promotion Threshold: -XX:MaxTenuringThreshold=15'],
        methods: ['Collected By: Major / Mixed GC (G1GC Concurrent Mark + Evacuation or ZGC)']
      },
      {
        name: '3. GC Roots (Starting Points of Mark Phase)',
        stereotype: 'singleton',
        role: 'Objects guaranteed to be alive from which GC traces the reachability graph.',
        fields: ['1. Local variables on active Thread Stacks', '2. Static fields of loaded Classes', '3. Active JNI / Native references'],
        methods: ['Unreachable islands (even with A ⇄ B cycles) are reclaimed!']
      }
    ],
    javaCode: [
      'public class GenerationalGCDemo {',
      '    // GC ROOT #1: Static field lives for the lifetime of the ClassLoader',
      '    private static final List<Object> STATIC_CACHE = new ArrayList<>();',
      '',
      '    public void processRequest() {',
      '        // GC ROOT #2: Local stack variable `tempDto` allocated in Eden TLAB',
      '        Object tempDto = new Object();',
      '',
      '        // Cyclic island: A <-> B. Reclaimed cleanly once method exits!',
      '        Node a = new Node(); Node b = new Node();',
      '        a.next = b; b.next = a;',
      '',
      '        // Long-lived object added to STATIC_CACHE:',
      '        // Survives Minor GCs (Eden -> S0 -> S1, age 1..15) -> Promoted to Old Gen!',
      '        STATIC_CACHE.add(new Object());',
      '    } // <-- Method exits: `tempDto`, `a`, and `b` lose GC Root & die in Eden!',
      '}'
    ],
    pythonCode: [
      'import gc',
      '',
      '# Python uses Reference Counting + a 3-Generation Cyclic Garbage Collector (Gen 0, 1, 2):',
      'class Node:',
      '    def __init__(self):',
      '        self.next = None',
      '',
      'def process_request():',
      '    # Normal objects are freed immediately when refcount hits 0',
      '    # Reference cycles (a <-> b) are collected by Generational GC (Gen 0 -> Gen 1 -> Gen 2):',
      '    a, b = Node(), Node()',
      '    a.next, b.next = b, a',
      '',
      'process_request()',
      'collected = gc.collect(generation=0)  # Minor GC sweep on Generation 0'
    ],
    scenarios: [
      {
        id: 'generational-gc-lifecycle',
        label: '1. Complete Object Journey: Eden TLAB Allocation → Minor GC Copy to S0 (95% Die) → Promote to Old Gen',
        summary: 'Traces objects from allocation in Eden through Minor GC evacuation to Survivor S0/S1 and promotion to Old Generation.',
        steps: [
          {
            title: 'Step 1: Fast TLAB Allocation in Eden Space (Young Generation)',
            explanation: 'New objects (tempDto, cyclic nodes A⇄B, and cachedObj) are allocated in Eden using a lock-free Thread-Local Allocation Buffer (TLAB) pointer bump.',
            status: 'info',
            activeArchNodes: ['alloc', 'eden'],
            activeArchEdge: { from: 'alloc', to: 'eden', call: 'new Object() → Eden TLAB' },
            domainGroups: [
              {
                title: 'JVM Heap Generations (Eden Fills Up)',
                layout: 'row',
                cells: [
                  { id: 'e', label: 'Eden Space', sublabel: '[tempDto, A⇄B, cachedObj]', badge: '100% FULL', status: 'warning' },
                  { id: 's0', label: 'Survivor S0', sublabel: '[ empty ]', status: 'default' },
                  { id: 's1', label: 'Survivor S1', sublabel: '[ empty ]', status: 'default' },
                  { id: 'o', label: 'Old Generation', sublabel: '[ Tenured Objects ]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Eden Space', value: 'Full (Triggers Minor GC)', changed: true },
              { label: 'S0 / S1', value: 'Empty' }
            ],
            activeLinesJava: [7, 10, 11, 15],
            activeLinesPy: [11, 12]
          },
          {
            title: 'Step 2: Minor GC Traces GC Roots → 95% Die in Eden & Survivors Copy to S0 (Age = 1)!',
            explanation: 'Minor GC traces from GC Roots: tempDto and the isolated cycle A⇄B are unreachable and wiped instantly! Only cachedObj (reachable from STATIC_CACHE root) is copied to Survivor S0 with age = 1.',
            status: 'success',
            activeArchNodes: ['eden', 'surv', 'roots'],
            activeArchEdge: { from: 'eden', to: 'surv', call: 'Evacuate live → S0 (age=1) · Wipe Eden!' },
            domainGroups: [
              {
                title: 'JVM Heap After Minor GC Copy (Zero Fragmentation!)',
                layout: 'row',
                cells: [
                  { id: 'e', label: 'Eden Space', sublabel: 'Wiped clean (tempDto & A⇄B freed)', badge: '♻️ 0% USED', status: 'success' },
                  { id: 's0', label: 'Survivor S0', sublabel: '[ cachedObj (age=1) ]', badge: 'AGE = 1', status: 'active' },
                  { id: 's1', label: 'Survivor S1', sublabel: '[ empty target ]', status: 'default' },
                  { id: 'o', label: 'Old Generation', sublabel: '[ Tenured Objects ]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Dead in Eden', value: 'tempDto + Cycle A⇄B Freed ♻️', changed: true },
              { label: 'Survivor S0', value: 'cachedObj (age = 1)', changed: true }
            ],
            activeLinesJava: [3, 15, 16],
            activeLinesPy: [14, 15]
          },
          {
            title: 'Step 3: After Surviving Threshold Rounds (S0 ⇄ S1) → Promoted to Old Generation!',
            explanation: 'After bouncing between S0 and S1 across Minor GCs and reaching the tenuring threshold (age = 15), cachedObj is promoted into the Old (Tenured) Generation!',
            status: 'success',
            activeArchNodes: ['surv', 'old', 'roots'],
            activeArchEdge: { from: 'surv', to: 'old', call: 'age == 15 → Promote to Old Gen ✓' },
            domainGroups: [
              {
                title: 'JVM Heap After Tenuring Promotion to Old Generation',
                layout: 'row',
                cells: [
                  { id: 'e', label: 'Eden Space', sublabel: 'Ready for new allocations', status: 'default' },
                  { id: 's0', label: 'Survivor S0 / S1', sublabel: 'Promoted out', status: 'muted' },
                  { id: 'o', label: 'Old Generation (Tenured)', sublabel: '[ ..., cachedObj (Tenured) ]', badge: '✅ PROMOTED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'cachedObj Age', value: '15 → Tenured ✓', changed: true },
              { label: 'Location', value: 'Old Generation', changed: true }
            ],
            activeLinesJava: [3, 14, 15],
            activeLinesPy: [15]
          }
        ]
      }
    ]
  }
};
