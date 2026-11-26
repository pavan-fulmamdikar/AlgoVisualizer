import type { LLDProblemData } from './lldTypes';

export const CONCURRENCY_PART1: Record<string, LLDProblemData> = {
  // ===========================================================================
  // 1. CONCURRENCY BASICS
  // ===========================================================================
  'concurrency-basics': {
    slug: 'concurrency-basics',
    num: 1,
    title: 'Concurrency Basics',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Race Condition (Read-Modify-Write)', 'Critical Section', 'Mutual Exclusion'],
    concurrencyNote: 'Atomicity + Visibility + Ordering (The 3 Pillars of Concurrency)',
    analogy:
      'Imagine two people sharing one bank account with ₹100. Both check the balance on their phone at the exact same second and see ₹100. Both add ₹50 and save "₹150" back to the database. Even though ₹50 was deposited twice, the final balance is ₹150 instead of ₹200! That 3-step gap (Read → Add → Write) is called a Race Condition.',
    requirements: [
      'Understand why count++ is NOT a single atomic CPU instruction (it is 3 steps: READ count, ADD 1 in CPU register, WRITE back to RAM).',
      'Identify the Critical Section: any code block that reads and modifies shared mutable state.',
      'Protect the Critical Section using mutual exclusion (synchronized) or hardware atomics (AtomicInteger).'
    ],
    patternExplanations: [
      {
        pattern: 'The 3-Step Read-Modify-Write Hazard',
        why: 'At the bytecode/CPU level, count++ compiles to getfield (read from RAM to register), iconst_1 + iadd (add 1 in register), and putfield (write register back to RAM). An OS context switch can pause a thread right between getfield and putfield!'
      },
      {
        pattern: 'Mutual Exclusion (Monitor Lock)',
        why: 'Wrapping count++ inside synchronized ensures only one thread can enter the 3-step critical section at a time. The second thread waits outside until the first thread finishes writing to RAM.'
      }
    ],
    edgeCases: [
      {
        title: 'Read-only shared data (Immutable objects)',
        solution: 'If multiple threads only READ an immutable object (final fields, no setters), no race condition can ever occur and no locks are needed!'
      }
    ],
    followUps: [
      {
        q: 'What is the difference between Concurrency and Parallelism?',
        a: 'Concurrency is about STRUCTURE (multiple tasks making overlapping progress, even on 1 CPU core via time-slicing). Parallelism is about EXECUTION (multiple tasks physically running at the exact same instant on multiple CPU cores).'
      }
    ],
    archNodes: [
      { id: 't1', label: 'Thread-1', sublabel: 'increment()', layer: 'client', x: 110, y: 72 },
      { id: 't2', label: 'Thread-2', sublabel: 'increment()', layer: 'controller', x: 345, y: 72 },
      { id: 'gate', label: 'Critical Section', sublabel: 'READ → +1 → WRITE', layer: 'pattern', x: 460, y: 172 },
      { id: 'cpu', label: 'CPU Registers', sublabel: 'T1_reg / T2_reg', layer: 'service', x: 645, y: 172 },
      { id: 'ram', label: 'Main RAM', sublabel: 'int count = 0', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 't1', to: 't2', label: 'parallel' },
      { from: 't2', to: 'gate', label: 'enter' },
      { from: 'gate', to: 'cpu', label: 'compute +1' },
      { from: 'cpu', to: 'ram', label: 'write count' },
      { from: 't2', to: 'ram', label: 'read count' }
    ],
    umlClasses: [
      {
        name: 'UnsafeCounter (❌ Broken)',
        stereotype: 'class',
        role: 'Allows multiple threads to interleave inside count++, losing updates under load.',
        fields: ['- count: int = 0'],
        methods: ['+ increment(): void  // count++ (3 non-atomic steps)']
      },
      {
        name: 'SafeCounter (✅ Fixed)',
        stereotype: 'class',
        role: 'Guards the critical section with a monitor lock (or AtomicInteger) so every increment is preserved.',
        fields: ['- count: int = 0'],
        methods: ['+ synchronized increment(): void', '+ synchronized getCount(): int']
      }
    ],
    javaCode: [
      '// ❌ BROKEN: count++ is 3 separate CPU instructions (Read -> Add -> Write)',
      'class UnsafeCounter {',
      '    int count = 0;',
      '    public void increment() {',
      '        int temp = count;    // Step A: Read from RAM into CPU register',
      '        temp = temp + 1;     // Step B: Add 1 inside register',
      '        count = temp;        // Step C: Write register back to RAM',
      '    }',
      '}',
      '',
      '// ✅ FIXED: synchronized ensures only 1 thread enters at a time',
      'public class SafeCounter {',
      '    private int count = 0;',
      '',
      '    public synchronized void increment() {',
      '        count++; // Thread-2 waits until Thread-1 completes all 3 steps',
      '    }',
      '    public synchronized int getCount() {',
      '        return count;',
      '    }',
      '}'
    ],
    pythonCode: [
      'from threading import Lock',
      '',
      '# ❌ BROKEN: Race condition when threads interleave read and write',
      'class UnsafeCounter:',
      '    def __init__(self):',
      '        self.count = 0',
      '    def increment(self):',
      '        temp = self.count    # Step A: Read',
      '        temp = temp + 1      # Step B: Add 1',
      '        self.count = temp    # Step C: Write',
      '',
      '# ✅ FIXED: Lock guards the critical section',
      'class SafeCounter:',
      '    def __init__(self):',
      '        self.count = 0',
      '        self._lock = Lock()',
      '    def increment(self):',
      '        with self._lock:',
      '            self.count += 1'
    ],
    scenarios: [
      {
        id: 'race-condition-bug',
        label: '❌ Broken: Race Condition (Lost Update)',
        summary: 'Thread-1 and Thread-2 both read count = 0 simultaneously, both add 1, and both write 1—losing an entire increment!',
        steps: [
          {
            title: 'Step 1: Start — Main RAM Has count = 0 & Both Threads Call increment()',
            explanation: 'Starting state: Main RAM holds count = 0. Thread-1 and Thread-2 both call increment() at the exact same moment with no lock.',
            status: 'info',
            activeArchNodes: ['t1', 't2', 'ram'],
            activeArchEdge: { from: 't1', to: 't2', call: 'Both call increment()' },
            domainGroups: [
              {
                title: 'Thread Registers & Shared Main RAM',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1 Reg', sublabel: 'Starting...', badge: '🟢 RUN', status: 'active' },
                  { id: 'c2', label: 'Thread-2 Reg', sublabel: 'Starting...', badge: '🟢 RUN', status: 'active' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Initial Value = 0', badge: 'RAM = 0', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'RAM count', value: '0' },
              { label: 'T1 Register', value: '—' },
              { label: 'T2 Register', value: '—' }
            ],
            activeLinesJava: [3, 4],
            activeLinesPy: [6, 7]
          },
          {
            title: 'Step 2: Both Threads Read count = 0 from Main RAM at the Same Time!',
            explanation: 'Before Thread-1 can add 1 and write back, Thread-2 ALSO reads count from Main RAM. Now BOTH CPU registers hold temp = 0!',
            status: 'warning',
            activeArchNodes: ['t2', 'ram', 'cpu'],
            activeArchEdge: { from: 't2', to: 'ram', call: 'T1 & T2 both read 0!' },
            domainGroups: [
              {
                title: 'Thread Registers & Shared Main RAM',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1 Reg', sublabel: 'Read temp = 0', badge: 'TEMP = 0', status: 'warning' },
                  { id: 'c2', label: 'Thread-2 Reg', sublabel: 'Read temp = 0 (Stale!)', badge: 'TEMP = 0', status: 'warning' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Still 0', badge: 'RAM = 0', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'RAM count', value: '0' },
              { label: 'T1 Register', value: '0', changed: true },
              { label: 'T2 Register', value: '0 (Collision!)', changed: true }
            ],
            activeLinesJava: [5],
            activeLinesPy: [8]
          },
          {
            title: 'Step 3: Both Threads Compute 0 + 1 = 1 in Their Own Registers',
            explanation: 'Thread-1 computes 0 + 1 = 1 and writes count = 1 to RAM. Thread-2 (unaware of Thread-1) also computes 0 + 1 = 1 in its register!',
            status: 'warning',
            activeArchNodes: ['gate', 'cpu'],
            activeArchEdge: { from: 'gate', to: 'cpu', call: 'temp = 0 + 1 = 1' },
            domainGroups: [
              {
                title: 'Thread Registers & Shared Main RAM',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1 Reg', sublabel: 'Computed 0+1 = 1', badge: 'WROTE 1', status: 'active' },
                  { id: 'c2', label: 'Thread-2 Reg', sublabel: 'Computed 0+1 = 1', badge: 'TEMP = 1', status: 'danger' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Updated to 1 by T1', badge: 'RAM = 1', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'RAM count', value: '1 (T1 wrote)', changed: true },
              { label: 'T1 Register', value: '1' },
              { label: 'T2 Register', value: '1 (About to overwrite!)', changed: true }
            ],
            activeLinesJava: [6, 7],
            activeLinesPy: [9, 10]
          },
          {
            title: 'Step 4: Thread-2 Overwrites RAM with 1 → Lost Update Bug (1 Instead of 2!)',
            explanation: 'Thread-2 writes its temp = 1 to Main RAM, overwriting Thread-1’s work! Two increments ran, but count is 1 instead of 2.',
            status: 'error',
            activeArchNodes: ['cpu', 'ram'],
            activeArchEdge: { from: 'cpu', to: 'ram', call: 'Overwrite count = 1 (BUG!)' },
            domainGroups: [
              {
                title: 'Thread Registers & Shared Main RAM (Race Condition Bug!)',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Work overwritten!', badge: 'LOST ✗', status: 'danger' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Wrote 1 over 1', badge: 'OVERWROTE', status: 'danger' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Expected 2, Got 1!', badge: '❌ BUG: 1 != 2', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'Expected', value: '2' },
              { label: 'Actual RAM', value: '1 (Lost Update!)', changed: true },
              { label: 'Result', value: '❌ Race Condition', changed: true }
            ],
            activeLinesJava: [7],
            activeLinesPy: [10]
          }
        ]
      },
      {
        id: 'synchronized-fix',
        label: '✅ Fixed: synchronized Mutual Exclusion',
        summary: 'Thread-1 acquires the monitor lock first (0 → 1), while Thread-2 waits outside and then increments (1 → 2).',
        steps: [
          {
            title: 'Step 1: Thread-1 Acquires Monitor Lock; Thread-2 Waits at Gate',
            explanation: 'With synchronized increment(), Thread-1 acquires the lock and enters the Critical Section. Thread-2 is cleanly paused in BLOCKED state at the gate.',
            status: 'info',
            activeArchNodes: ['t1', 't2', 'gate'],
            activeArchEdge: { from: 't2', to: 'gate', call: 'T1 Lock ✓ · T2 BLOCKED' },
            domainGroups: [
              {
                title: 'Synchronized Critical Section & Main RAM',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Holds Lock 🔒', badge: '🟢 IN LOCK', status: 'active' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Waiting for Lock...', badge: '🟡 BLOCKED', status: 'warning' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Value = 0', badge: 'RAM = 0', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Lock Owner', value: 'Thread-1 🔒', changed: true },
              { label: 'Thread-2', value: 'BLOCKED (Waiting)' },
              { label: 'RAM count', value: '0' }
            ],
            activeLinesJava: [15, 16],
            activeLinesPy: [17, 18, 19]
          },
          {
            title: 'Step 2: Thread-1 Completes 0 → 1 in RAM & Releases Lock',
            explanation: 'Thread-1 safely reads 0, adds 1, writes count = 1 to Main RAM, and unlocks the monitor—waking up Thread-2.',
            status: 'success',
            activeArchNodes: ['gate', 'cpu', 'ram'],
            activeArchEdge: { from: 'cpu', to: 'ram', call: 'T1 writes count = 1 & unlocks' },
            domainGroups: [
              {
                title: 'Synchronized Critical Section & Main RAM',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Done & Unlocked', badge: '✅ DONE', status: 'success' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Acquiring Lock...', badge: '🟢 WAKING', status: 'active' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Flushed to 1', badge: 'RAM = 1', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Lock Owner', value: 'Handing to T2', changed: true },
              { label: 'RAM count', value: '1', changed: true }
            ],
            activeLinesJava: [16, 17],
            activeLinesPy: [18, 19]
          },
          {
            title: 'Step 3: Thread-2 Enters Lock, Reads Fresh count = 1, and Writes 2!',
            explanation: 'Thread-2 enters the lock, reads the fresh value 1 from Main RAM, adds 1, and writes count = 2. Zero lost updates!',
            status: 'success',
            activeArchNodes: ['t2', 'gate', 'cpu', 'ram'],
            activeArchEdge: { from: 'cpu', to: 'ram', call: 'T2 reads 1 → writes 2 ✓' },
            domainGroups: [
              {
                title: 'Synchronized Critical Section & Main RAM (100% Accurate)',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Completed (+1)', status: 'muted' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Completed (+1)', badge: '✅ DONE', status: 'success' },
                  { id: 'ram', label: 'Main RAM: count', sublabel: 'Both increments saved!', badge: '✅ RAM = 2', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Lock Owner', value: 'Released ✓', changed: true },
              { label: 'Final RAM', value: '2 (Correct!)', changed: true }
            ],
            activeLinesJava: [15, 16, 17],
            activeLinesPy: [18, 19]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 2. SYNCHRONIZATION (TYPES & USE CASES)
  // ===========================================================================
  'synchronization-types': {
    slug: 'synchronization-types',
    num: 2,
    title: 'Synchronization (Types & Use Cases)',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Instance Monitor (this)', 'Class Monitor (MyClass.class)', 'Fine-Grained Block Lock'],
    concurrencyNote: 'Every Java Object Has an Intrinsic Monitor (Entry Set + Wait Set)',
    analogy:
      'Think of a building with rooms: 1) A synchronized instance method locks the entire room (this). 2) A synchronized(lockObj) block only locks a small safe-deposit box inside the room, letting other people walk around the room freely. 3) A static synchronized method locks the entire building blueprint (Class.class) across all rooms!',
    requirements: [
      'Distinguish the 3 monitor lock scopes: Instance method (this), Static method (ClassName.class), and Synchronized Block (custom lock object).',
      'Understand Intrinsic Monitor internals: Owner, Entry Set (BLOCKED threads waiting to acquire), and Wait Set (WAITING threads that called wait()).',
      'Minimize lock scope using synchronized blocks to maximize throughput.'
    ],
    patternExplanations: [
      {
        pattern: 'Private Final Lock Object vs synchronized(this)',
        why: 'Locking on a private final Object lock = new Object() prevents external caller code from accidentally locking on your public instance and causing a denial-of-service deadlock.'
      },
      {
        pattern: 'Instance Lock (this) vs Static Lock (MyClass.class)',
        why: 'Two threads can run a synchronized instance method and a static synchronized method AT THE SAME TIME because they lock two completely different monitors (this vs MyClass.class)!'
      }
    ],
    edgeCases: [
      {
        title: 'Locking on a String literal or boxed Integer (e.g., synchronized("LOCK"))',
        solution: 'Never lock on interned Strings or cached Integer objects—unrelated parts of the JVM share the same literal reference and will block each other!'
      }
    ],
    followUps: [
      {
        q: 'What is Reentrancy in Java synchronized monitors?',
        a: 'If Thread-1 already holds the lock on `this`, it can call another synchronized method on `this` without deadlocking itself. The JVM increments a recursion counter (1 → 2) and only releases the monitor when the counter returns to 0.'
      }
    ],
    archNodes: [
      { id: 'threads', label: 'Caller Threads', sublabel: 'T1, T2, T3', layer: 'client', x: 110, y: 72 },
      { id: 'entry', label: 'Monitor EntrySet', sublabel: 'BLOCKED Queue', layer: 'controller', x: 345, y: 72 },
      { id: 'owner', label: 'Active Monitor', sublabel: 'Owner + Count', layer: 'pattern', x: 460, y: 172 },
      { id: 'wait', label: 'Monitor WaitSet', sublabel: 'wait() / notify()', layer: 'service', x: 645, y: 172 },
      { id: 'state', label: 'Guarded State', sublabel: 'this vs .class', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'threads', to: 'entry', label: 'contend' },
      { from: 'entry', to: 'owner', label: 'acquire' },
      { from: 'owner', to: 'wait', label: 'wait()' },
      { from: 'wait', to: 'entry', label: 'notify()' },
      { from: 'owner', to: 'state', label: 'mutate' }
    ],
    umlClasses: [
      {
        name: '1. Instance Synchronized',
        stereotype: 'class',
        role: 'Locks on `this` instance. Different instances do not block each other.',
        fields: ['Lock Target: this'],
        methods: ['+ synchronized void updateInstance()']
      },
      {
        name: '2. Static Synchronized',
        stereotype: 'class',
        role: 'Locks on `Account.class` Class object across ALL instances in the JVM.',
        fields: ['Lock Target: Account.class'],
        methods: ['+ static synchronized void updateGlobal()']
      },
      {
        name: '3. Fine-Grained Block Lock (Best Practice)',
        stereotype: 'class',
        role: 'Locks ONLY the 2 lines that touch shared state using a private final lock object.',
        fields: ['- final Object lock = new Object()'],
        methods: ['+ void process() { /* non-locked prep */ synchronized(lock) { ... } }']
      }
    ],
    javaCode: [
      'public class SynchronizationTypes {',
      '    private final Object balanceLock = new Object();',
      '    private int balance = 100;',
      '    private static int totalBankAccounts = 0;',
      '',
      '    // 1. Instance Method Lock -> locks on `this`',
      '    public synchronized void depositInstance(int amt) {',
      '        balance += amt;',
      '    }',
      '',
      '    // 2. Fine-Grained Block Lock -> locks ONLY critical lines on private lock',
      '    public void depositFast(int amt) {',
      '        validateAmount(amt); // Runs in parallel without lock!',
      '        synchronized (balanceLock) {',
      '            balance += amt;',
      '        }',
      '    }',
      '',
      '    // 3. Static Method Lock -> locks on `SynchronizationTypes.class`',
      '    public static synchronized void incrementGlobalCount() {',
      '        totalBankAccounts++;',
      '    }',
      '}'
    ],
    pythonCode: [
      'from threading import RLock',
      '',
      'class SynchronizationTypes:',
      '    _class_lock = RLock()   # Equivalent to static Class.class lock',
      '    total_accounts = 0',
      '',
      '    def __init__(self):',
      '        self._balance_lock = RLock()  # Fine-grained instance lock',
      '        self.balance = 100',
      '',
      '    def deposit_fast(self, amt: int) -> None:',
      '        # Non-critical validation runs outside lock in parallel',
      '        if amt <= 0: raise ValueError()',
      '        with self._balance_lock:',
      '            self.balance += amt',
      '',
      '    @classmethod',
      '    def increment_global(cls) -> None:',
      '        with cls._class_lock:',
      '            cls.total_accounts += 1'
    ],
    scenarios: [
      {
        id: 'monitor-flow',
        label: '1. Monitor Lifecycle: Entry Set → Acquire Owner → wait() to Wait Set → notify() & Release',
        summary: 'Traces how threads move through a Java Object Monitor’s Entry Set, Active Owner, and Wait Set.',
        steps: [
          {
            title: 'Step 1: T1 & T2 Contend for Monitor → T1 Becomes Owner, T2 Enters EntrySet',
            explanation: 'Thread-1 and Thread-2 enter synchronized(balanceLock). Thread-1 acquires ownership (recursion count = 1), while Thread-2 waits in the Monitor EntrySet (BLOCKED).',
            status: 'info',
            activeArchNodes: ['threads', 'entry', 'owner'],
            activeArchEdge: { from: 'entry', to: 'owner', call: 'T1 acquires · T2 BLOCKED' },
            domainGroups: [
              {
                title: 'Java Intrinsic Object Monitor State',
                layout: 'row',
                cells: [
                  { id: 'e', label: 'Entry Set (BLOCKED)', sublabel: '[ Thread-2 ]', badge: 'WAITING LOCK', status: 'warning' },
                  { id: 'o', label: 'Monitor Owner', sublabel: 'Thread-1 (count=1)', badge: '🔒 OWNER', status: 'active' },
                  { id: 'w', label: 'Wait Set (WAITING)', sublabel: '[ empty ]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Monitor Owner', value: 'Thread-1', changed: true },
              { label: 'Entry Set', value: '[Thread-2]' },
              { label: 'Wait Set', value: '[]' }
            ],
            activeLinesJava: [12, 13, 14],
            activeLinesPy: [11, 13, 14]
          },
          {
            title: 'Step 2: Fine-Grained Block Mutates Shared Balance & Releases Monitor',
            explanation: 'Because validateAmount() ran outside synchronized(balanceLock), Thread-1 holds the lock for only nanoseconds to update balance += 50, then exits the block.',
            status: 'success',
            activeArchNodes: ['owner', 'state'],
            activeArchEdge: { from: 'owner', to: 'state', call: 'balance += 50 → 150' },
            domainGroups: [
              {
                title: 'Java Intrinsic Object Monitor State',
                layout: 'row',
                cells: [
                  { id: 'e', label: 'Entry Set', sublabel: 'T2 waking up...', badge: 'NEXT', status: 'active' },
                  { id: 'o', label: 'Monitor Owner', sublabel: 'T1 releasing → T2', badge: 'UNLOCKING', status: 'success' },
                  { id: 's', label: 'Guarded Balance', sublabel: '100 → 150', badge: '₹150 ✓', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Monitor Owner', value: 'Thread-2 (Acquired)', changed: true },
              { label: 'Balance', value: '₹150', changed: true }
            ],
            activeLinesJava: [14, 15, 16],
            activeLinesPy: [14, 15]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 3. VOLATILE KEYWORD
  // ===========================================================================
  'volatile-keyword': {
    slug: 'volatile-keyword',
    num: 3,
    title: 'volatile Keyword',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['JMM Memory Visibility', 'Read/Write Memory Barrier', 'Happens-Before Guarantee'],
    concurrencyNote: 'Guarantees Visibility & Prevents Instruction Reordering (NOT Atomicity!)',
    analogy:
      'Without volatile, each CPU Core keeps a private sticky note (L1 Cache) of variables so it does not have to walk to the hallway whiteboard (Main RAM) every loop iteration. If Thread-1 erases the hallway whiteboard and writes running = false, Thread-2 keeps looking at its private sticky note (running = true) and loops forever! Marking a variable volatile forces every read and write to go straight to the hallway whiteboard.',
    requirements: [
      'Solve CPU Core Cache visibility bugs where one thread updates a flag and another thread never sees the change.',
      'Insert JVM Memory Barriers that flush writes immediately to Main RAM and invalidate other cores’ L1/L2 cache lines.',
      'Prevent compiler/CPU instruction reordering across a volatile read or write (Happens-Before guarantee).'
    ],
    patternExplanations: [
      {
        pattern: 'Cache Coherency & Store-Load Memory Barrier',
        why: 'A volatile write emits a StoreLoad barrier that flushes the CPU core’s store buffer to Main RAM and invalidates that cache line across all other CPU cores.'
      },
      {
        pattern: 'When volatile is Enough vs Not Enough',
        why: 'volatile is sufficient when ONE thread writes a status flag (running = false) and other threads only read it. It is NOT sufficient for count++ where multiple threads read-modify-write.'
      }
    ],
    edgeCases: [
      {
        title: 'volatile Object[] or volatile Reference',
        solution: 'Making a reference volatile only makes reassigning the reference visible—mutating elements inside an array (arr[0] = 5) is NOT volatile! Use AtomicReferenceArray instead.'
      }
    ],
    followUps: [
      {
        q: 'Why does Double-Checked Locking Singleton require the instance field to be volatile?',
        a: 'Without volatile, the CPU can reorder `instance = new Singleton()` so the memory pointer is assigned BEFORE the constructor finishes running—causing another thread to see a non-null but half-initialized object!'
      }
    ],
    archNodes: [
      { id: 'writer', label: 'Thread-1 (Writer)', sublabel: 'stop() on Core 1', layer: 'client', x: 110, y: 72 },
      { id: 'c1', label: 'CPU Core 1 L1', sublabel: 'Store Buffer', layer: 'controller', x: 345, y: 72 },
      { id: 'c2', label: 'CPU Core 2 L1', sublabel: 'Reader Cache', layer: 'pattern', x: 460, y: 172 },
      { id: 'reader', label: 'Thread-2 (Reader)', sublabel: 'while(running)', layer: 'service', x: 645, y: 172 },
      { id: 'ram', label: 'Main RAM', sublabel: 'boolean running', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'writer', to: 'c1', label: 'running=false' },
      { from: 'c1', to: 'ram', label: 'flush barrier' },
      { from: 'c1', to: 'c2', label: 'invalidate' },
      { from: 'c2', to: 'reader', label: 'read flag' },
      { from: 'ram', to: 'reader', label: 'fresh false' }
    ],
    umlClasses: [
      {
        name: 'Without volatile (❌ Visibility Bug)',
        stereotype: 'class',
        role: 'JIT compiler hoists non-volatile `while(running)` into a CPU register/L1 cache check, looping forever.',
        fields: ['- boolean running = true'],
        methods: ['+ run(): while (running) { ... }  // Infinite loop!']
      },
      {
        name: 'With volatile (✅ JMM Barrier)',
        stereotype: 'class',
        role: 'Forces every write to flush to RAM and every read to fetch fresh state.',
        fields: ['- volatile boolean running = true'],
        methods: ['+ stop(): running = false', '+ run(): while (running) { ... }']
      }
    ],
    javaCode: [
      'public class TaskRunner {',
      '    // Without `volatile`, Thread-2 may cache `running = true` in CPU L1 cache forever!',
      '    private volatile boolean running = true;',
      '',
      '    // Runs on Thread-2 (CPU Core 2)',
      '    public void runWorkerLoop() {',
      '        while (running) {',
      '            // Do background work...',
      '        }',
      '        System.out.println("Worker stopped cleanly!");',
      '    }',
      '',
      '    // Runs on Thread-1 (CPU Core 1)',
      '    public void stopWorker() {',
      '        running = false; // volatile flushes to RAM & invalidates Core 2 cache',
      '    }',
      '}'
    ],
    pythonCode: [
      'import threading',
      '',
      '# In Python, threading.Event provides the cross-thread visibility guarantee',
      'class TaskRunner:',
      '    def __init__(self):',
      '        self._running_event = threading.Event()',
      '        self._running_event.set()  # running = True',
      '',
      '    def run_worker_loop(self):',
      '        while self._running_event.is_set():',
      '            pass  # Do work',
      '        print("Worker stopped cleanly!")',
      '',
      '    def stop_worker(self):',
      '        self._running_event.clear()  # Immediately visible to worker thread'
    ],
    scenarios: [
      {
        id: 'without-volatile-bug',
        label: '❌ Broken: Without volatile (Stale L1 Cache Infinite Loop)',
        summary: 'Thread-1 sets running = false on Core 1, but Core 2 keeps reading its stale L1 cache (running = true) and never stops!',
        steps: [
          {
            title: 'Step 1: Start — Both CPU Cores Cache running = true from Main RAM',
            explanation: 'Thread-2 starts runWorkerLoop() on CPU Core 2. To go fast, Core 2 caches running = true in its local L1 cache instead of reading Main RAM.',
            status: 'info',
            activeArchNodes: ['c2', 'reader', 'ram'],
            activeArchEdge: { from: 'c2', to: 'reader', call: 'Core 2 L1 caches running=true' },
            domainGroups: [
              {
                title: 'CPU Core L1 Caches vs Shared Main RAM',
                layout: 'row',
                cells: [
                  { id: 'l1', label: 'Core 1 L1 Cache', sublabel: 'running = true', status: 'default' },
                  { id: 'ram', label: 'Main RAM', sublabel: 'running = true', status: 'default' },
                  { id: 'l2', label: 'Core 2 L1 Cache', sublabel: 'running = true (Cached)', badge: 'T2 LOOPING', status: 'active' }
                ]
              }
            ],
            stateChips: [
              { label: 'Core 1 L1', value: 'true' },
              { label: 'Main RAM', value: 'true' },
              { label: 'Core 2 L1 (T2)', value: 'true (Looping)' }
            ],
            activeLinesJava: [6, 7],
            activeLinesPy: [9, 10]
          },
          {
            title: 'Step 2: Thread-1 Calls stopWorker() → Core 1 Writes running = false Locally',
            explanation: 'Thread-1 sets running = false on CPU Core 1. Without a volatile memory barrier, Core 2’s cached copy is NOT invalidated (or JIT hoisted the read)!',
            status: 'error',
            activeArchNodes: ['writer', 'c1', 'c2', 'reader'],
            activeArchEdge: { from: 'writer', to: 'c1', call: 'running=false (Stuck in Core 1!)' },
            domainGroups: [
              {
                title: 'CPU Core L1 Caches vs Shared Main RAM (Visibility Bug!)',
                layout: 'row',
                cells: [
                  { id: 'l1', label: 'Core 1 L1 (T1)', sublabel: 'running = false', badge: 'UPDATED', status: 'success' },
                  { id: 'ram', label: 'Main RAM', sublabel: 'No volatile barrier', status: 'muted' },
                  { id: 'l2', label: 'Core 2 L1 (T2)', sublabel: 'STALE running = true!', badge: '❌ INFINITE LOOP', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'Core 1 L1', value: 'false', changed: true },
              { label: 'Core 2 L1 (T2)', value: 'true (STALE!)', changed: true },
              { label: 'Thread-2', value: '❌ Stuck Forever', changed: true }
            ],
            activeLinesJava: [7, 14, 15],
            activeLinesPy: [10, 14, 15]
          }
        ]
      },
      {
        id: 'with-volatile-fix',
        label: '✅ Fixed: With volatile (RAM Flush & Cache Invalidation)',
        summary: 'Marking running volatile forces Core 1 to flush to Main RAM and invalidates Core 2’s L1 cache line so Thread-2 exits immediately.',
        steps: [
          {
            title: 'Step 1: Thread-1 Writes volatile running = false → Store Barrier Flushes to RAM',
            explanation: 'With volatile boolean running, Thread-1’s write emits a JMM StoreLoad memory barrier that immediately flushes running = false to Main RAM.',
            status: 'info',
            activeArchNodes: ['writer', 'c1', 'ram'],
            activeArchEdge: { from: 'c1', to: 'ram', call: 'Volatile Flush → RAM=false' },
            domainGroups: [
              {
                title: 'CPU Core L1 Caches vs Shared Main RAM (Volatile Barrier)',
                layout: 'row',
                cells: [
                  { id: 'l1', label: 'Core 1 L1 (T1)', sublabel: 'running = false', badge: 'FLUSHED', status: 'active' },
                  { id: 'ram', label: 'Main RAM', sublabel: 'running = false', badge: 'RAM UPDATED ✓', status: 'success' },
                  { id: 'l2', label: 'Core 2 L1 (T2)', sublabel: 'Cache line invalidating...', badge: 'INVALIDATED', status: 'warning' }
                ]
              }
            ],
            stateChips: [
              { label: 'Modifier', value: 'volatile ✓' },
              { label: 'Main RAM', value: 'false (Flushed)', changed: true },
              { label: 'Core 2 L1', value: 'Invalidated', changed: true }
            ],
            activeLinesJava: [3, 14, 15],
            activeLinesPy: [14, 15]
          },
          {
            title: 'Step 2: Core 2 Cache Invalidated → Thread-2 Reads Fresh false from RAM & Stops!',
            explanation: 'Because Core 2’s L1 cache line was invalidated by the MESI coherency bus, Thread-2 fetches running = false directly from Main RAM and exits while(running) cleanly!',
            status: 'success',
            activeArchNodes: ['c1', 'c2', 'ram', 'reader'],
            activeArchEdge: { from: 'ram', to: 'reader', call: 'Read fresh false → Exit Loop ✓' },
            domainGroups: [
              {
                title: 'CPU Core L1 Caches vs Shared Main RAM (Clean Shutdown)',
                layout: 'row',
                cells: [
                  { id: 'l1', label: 'Core 1 L1 (T1)', sublabel: 'running = false', status: 'default' },
                  { id: 'ram', label: 'Main RAM', sublabel: 'running = false', status: 'success' },
                  { id: 'l2', label: 'Thread-2 (Core 2)', sublabel: 'Saw false → Exited!', badge: '✅ STOPPED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Thread-2 Read', value: 'false (Fresh from RAM)', changed: true },
              { label: 'Worker Status', value: 'Stopped Cleanly ✓', changed: true }
            ],
            activeLinesJava: [7, 10],
            activeLinesPy: [10, 12]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 4. VOLATILE / ATOMIC / TRANSIENT
  // ===========================================================================
  'volatile-atomic-transient': {
    slug: 'volatile-atomic-transient',
    num: 4,
    title: 'volatile / atomic / transient',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Hardware CAS (Compare-And-Swap)', 'Memory Visibility vs Atomicity', 'Serialization Filtering'],
    concurrencyNote: 'volatile = Visibility only · AtomicInteger = Visibility + Atomicity via CPU CAS · transient = Skip Serialization',
    analogy:
      'Interviewers love grouping these 3 keywords to test if you know the difference: 1) volatile is a transparent glass window (everyone sees the latest value immediately, but two people can still collide if both try to add 1). 2) AtomicInteger uses a hardware Compare-And-Swap (CAS) check ("only change 5 to 6 if it is STILL 5 right now; otherwise retry!"). 3) transient has nothing to do with threads—it tells Java "do NOT save this secret password field when serializing to disk/network!"',
    requirements: [
      'Explain why volatile int count; count++; is STILL not thread-safe (visibility without atomicity).',
      'Understand lock-free Compare-And-Swap (CAS): compareAndSet(expected, newVal) retries in a tiny loop on collision without OS thread suspension.',
      'Understand transient: excludes sensitive or derived fields from ObjectOutputStream serialization.'
    ],
    patternExplanations: [
      {
        pattern: 'Lock-Free CAS (AtomicInteger.incrementAndGet)',
        why: 'Instead of putting losing threads to sleep (expensive OS context switch), CPU instruction CMPXCHG atomically checks if memory == expected. If another thread changed it first, CAS returns false and re-reads in a 2-nanosecond spin loop.'
      },
      {
        pattern: 'transient Keyword',
        why: 'Marks fields like password, authToken, or Thread/Socket references so Java serialization ignores them (restoring them as null/0 on deserialization).'
      }
    ],
    edgeCases: [
      {
        title: 'The ABA Problem in CAS',
        solution: 'If value changes A → B → A, plain CAS thinks nothing changed. Use AtomicStampedReference (which pairs the value with a monotonically increasing version stamp) when node identity matters.'
      }
    ],
    followUps: [
      {
        q: 'When does AtomicInteger perform worse than LongAdder?',
        a: 'Under extreme contention (e.g., 64 threads hammering incrementAndGet() simultaneously), threads waste CPU retrying failed CAS loops. LongAdder splits the counter across an array of Cell[] slots so threads update different cells and sums them on read.'
      }
    ],
    archNodes: [
      { id: 't1', label: 'Thread-1', sublabel: 'incrementAndGet()', layer: 'client', x: 110, y: 72 },
      { id: 't2', label: 'Thread-2', sublabel: 'Concurrent CAS', layer: 'controller', x: 345, y: 72 },
      { id: 'cas', label: 'CPU CAS Engine', sublabel: 'CMPXCHG(exp, new)', layer: 'pattern', x: 460, y: 172 },
      { id: 'ser', label: 'Serializer', sublabel: 'skips transient', layer: 'service', x: 645, y: 172 },
      { id: 'ram', label: 'Atomic Memory', sublabel: 'volatile int value', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 't1', to: 't2', label: 'race' },
      { from: 't2', to: 'cas', label: 'CAS(0, 1)' },
      { from: 'cas', to: 'ram', label: 'atomic swap' },
      { from: 'cas', to: 'ser', label: 'serialize' },
      { from: 'ser', to: 'ram', label: 'mask secret' }
    ],
    umlClasses: [
      {
        name: 'volatile',
        stereotype: 'state',
        role: 'Visibility + Ordering ONLY. Use for single-writer boolean/status flags.',
        fields: ['volatile boolean shutdown'],
        methods: ['✓ Thread-safe for: flag = true', '✗ BROKEN for: count++']
      },
      {
        name: 'AtomicInteger (CAS)',
        stereotype: 'strategy',
        role: 'Visibility + Atomicity without locks using hardware Compare-And-Swap.',
        fields: ['private volatile int value'],
        methods: ['+ incrementAndGet(): int', '+ compareAndSet(expect, update): boolean']
      },
      {
        name: 'transient',
        stereotype: 'class',
        role: 'Serialization modifier (unrelated to threads): prevents field from being written to disk/wire.',
        fields: ['private transient String password'],
        methods: ['Deserializes as: null (never leaked to disk)']
      }
    ],
    javaCode: [
      'import java.io.Serializable;',
      'import java.util.concurrent.atomic.AtomicInteger;',
      '',
      'public class UserSession implements Serializable {',
      '    // 1. volatile: Visible across threads, only safe for single-step assignment',
      '    private volatile boolean active = true;',
      '',
      '    // 2. AtomicInteger: Lock-free thread-safe counter using hardware CAS loop',
      '    private final AtomicInteger requestCount = new AtomicInteger(0);',
      '',
      '    // 3. transient: Excluded when UserSession is serialized to disk/network',
      '    private transient String secretJwtToken;',
      '',
      '    public int recordRequest() {',
      '        // Internally runs CAS loop:',
      '        // do { prev = get(); next = prev + 1; } while (!compareAndSet(prev, next));',
      '        return requestCount.incrementAndGet();',
      '    }',
      '}'
    ],
    pythonCode: [
      'import pickle',
      '',
      'class UserSession:',
      '    def __init__(self, user: str, secret_token: str):',
      '        self.user = user',
      '        self.secret_token = secret_token',
      '',
      '    # Python equivalent of `transient`: exclude secret_token during pickle serialization',
      '    def __getstate__(self):',
      '        state = self.__dict__.copy()',
      '        state["secret_token"] = None  # Never persist secret!',
      '        return state'
    ],
    scenarios: [
      {
        id: 'cas-retry-loop',
        label: '✅ Lock-Free CAS Loop: Thread-1 & Thread-2 Race Without Locks + transient Skip',
        summary: 'Both threads read 0; Thread-1’s CAS(0 → 1) succeeds, Thread-2’s CAS(0 → 1) fails & automatically retries CAS(1 → 2) in nanoseconds!',
        steps: [
          {
            title: 'Step 1: Both Threads Read value = 0; Thread-1 Wins CAS(0 → 1)',
            explanation: 'Both Thread-1 and Thread-2 read value = 0. Thread-1 reaches CPU CAS Engine first: compareAndSet(expected=0, new=1) sees RAM == 0, so it atomically sets RAM = 1!',
            status: 'info',
            activeArchNodes: ['t1', 't2', 'cas', 'ram'],
            activeArchEdge: { from: 'cas', to: 'ram', call: 'T1: CAS(0 → 1) → true ✓' },
            domainGroups: [
              {
                title: 'Hardware CAS (Compare-And-Swap) Execution',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1 CAS', sublabel: 'CAS(exp=0, new=1)', badge: '✅ SUCCEEDED', status: 'success' },
                  { id: 'c2', label: 'Thread-2 CAS', sublabel: 'Trying CAS(exp=0, new=1)...', badge: 'IN FLIGHT', status: 'active' },
                  { id: 'r', label: 'Atomic Memory', sublabel: 'value = 1', badge: 'RAM = 1', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'T1 CAS(0,1)', value: 'true (Won)', changed: true },
              { label: 'Atomic RAM', value: '1', changed: true },
              { label: 'OS Locks Used', value: '0 (Lock-Free!)' }
            ],
            activeLinesJava: [9, 14, 16, 17],
            activeLinesPy: [4, 5]
          },
          {
            title: 'Step 2: Thread-2 CAS(0 → 1) Fails (RAM is 1 != 0) & Instantly Retries CAS(1 → 2)!',
            explanation: 'Thread-2’s CAS(expected=0, new=1) sees RAM is now 1 (not 0!), so it returns false WITHOUT overwriting! The do-while loop immediately re-reads prev=1 and succeeds with CAS(1 → 2).',
            status: 'success',
            activeArchNodes: ['t2', 'cas', 'ram'],
            activeArchEdge: { from: 't2', to: 'cas', call: 'T2 Retry: CAS(1 → 2) → true ✓' },
            domainGroups: [
              {
                title: 'Hardware CAS Retry + transient Serialization',
                layout: 'row',
                cells: [
                  { id: 'c2', label: 'Thread-2 CAS Retry', sublabel: 'CAS(0,1)✗ → CAS(1,2)✓', badge: '✅ RETRY WON', status: 'success' },
                  { id: 'r', label: 'Atomic Memory', sublabel: 'value = 2 (Zero Locks!)', badge: 'RAM = 2 ✓', status: 'success' },
                  { id: 'tr', label: 'transient JwtToken', sublabel: 'Skipped on Disk Save', badge: 'MASKED 🔒', status: 'locked' }
                ]
              }
            ],
            stateChips: [
              { label: 'T2 CAS(0,1)', value: 'false → Retried CAS(1,2) ✓', changed: true },
              { label: 'Atomic RAM', value: '2 (Accurate!)', changed: true },
              { label: 'transient Field', value: 'Excluded from Disk ✓' }
            ],
            activeLinesJava: [12, 16, 17],
            activeLinesPy: [9, 10, 11, 12]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 5. SYNCHRONIZED VS REENTRANTLOCK
  // ===========================================================================
  'synchronized-vs-reentrantlock': {
    slug: 'synchronized-vs-reentrantlock',
    num: 5,
    title: 'synchronized vs ReentrantLock',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['Timed tryLock()', 'Interruptible Lock Acquisition', 'Fair AQS FIFO Queue', 'Multiple Condition Queues'],
    concurrencyNote: 'Always Release ReentrantLock Inside a finally { lock.unlock(); } Block!',
    analogy:
      'Think of synchronized as an automatic hotel door lock: simple and unlocks automatically when you walk out, but if someone is inside forever, you wait in the hallway forever with no way to give up! ReentrantLock is a smart programmable lock: you can say "I will wait at most 2 seconds (tryLock(2s))—if it is still busy, I will go do something else instead of hanging the server!"',
    requirements: [
      'Compare implicit monitor locks (synchronized) with explicit java.util.concurrent.locks.ReentrantLock.',
      'Use tryLock(timeout, unit) to prevent cascading thread starvation when a downstream resource is slow.',
      'Understand Fairness (new ReentrantLock(true)) and multiple Condition queues (lock.newCondition()).',
      'Mandatory rule: ALWAYS call lock.unlock() in a finally block.'
    ],
    patternExplanations: [
      {
        pattern: 'Non-Blocking / Timed tryLock()',
        why: 'With synchronized, a blocked thread cannot timeout or be interrupted. ReentrantLock.tryLock(500, MILLISECONDS) lets your API fail fast or fallback gracefully instead of exhausting the Tomcat thread pool.'
      },
      {
        pattern: 'Multiple Condition Variables per Lock',
        why: 'synchronized has only one Wait Set (wait/notifyAll wakes up both producers AND consumers). ReentrantLock can create separate Condition notFull and Condition notEmpty queues.'
      }
    ],
    edgeCases: [
      {
        title: 'Exception thrown inside critical section before lock.unlock()',
        solution: 'If unlock() is not inside a finally block, the lock remains held forever and deadlocks the entire application!'
      }
    ],
    followUps: [
      {
        q: 'Why does Fair ReentrantLock(true) have lower throughput than Non-Fair ReentrantLock(false)?',
        a: 'In a non-fair lock, an already-running thread on the CPU can "barge in" and grab a just-released lock immediately instead of waiting thousands of nanoseconds for the OS to wake up a parked thread at the head of the AQS queue.'
      }
    ],
    archNodes: [
      { id: 't1', label: 'Thread-1', sublabel: 'Holds Lock (Slow I/O)', layer: 'client', x: 110, y: 72 },
      { id: 't2', label: 'Thread-2', sublabel: 'tryLock(500ms)', layer: 'controller', x: 345, y: 72 },
      { id: 'aqs', label: 'ReentrantLock AQS', sublabel: 'state + FIFO queue', layer: 'pattern', x: 460, y: 172 },
      { id: 'fallback', label: 'Fallback Handler', sublabel: 'Fast Degradation', layer: 'service', x: 645, y: 172 },
      { id: 'res', label: 'Shared Resource', sublabel: 'unlock() in finally', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 't1', to: 'res', label: 'lock()' },
      { from: 't2', to: 'aqs', label: 'tryLock(500ms)' },
      { from: 'aqs', to: 'fallback', label: 'timeout → false' },
      { from: 'aqs', to: 'res', label: 'acquired' }
    ],
    umlClasses: [
      {
        name: 'synchronized (Implicit Monitor)',
        stereotype: 'class',
        role: 'JVM-managed keyword lock; auto-releases on scope exit.',
        fields: ['Timeout: ✗ Impossible', 'Interruptible: ✗ No', 'Fairness: ✗ Always Non-Fair'],
        methods: ['Wait Queues: 1 (obj.wait / notifyAll)']
      },
      {
        name: 'ReentrantLock (Explicit AQS Lock)',
        stereotype: 'strategy',
        role: 'API lock offering timeouts, interruptibility, optional fairness, and multiple Conditions.',
        fields: ['Timeout: ✓ tryLock(time, unit)', 'Interruptible: ✓ lockInterruptibly()', 'Fairness: ✓ new ReentrantLock(true)'],
        methods: ['+ lock() / unlock() in finally', '+ newCondition(): Condition']
      }
    ],
    javaCode: [
      'import java.util.concurrent.TimeUnit;',
      'import java.util.concurrent.locks.ReentrantLock;',
      '',
      'public class PaymentProcessor {',
      '    private final ReentrantLock lock = new ReentrantLock(true); // Fair lock',
      '',
      '    public String processWithTimeout() throws InterruptedException {',
      '        // Wait at most 500ms instead of hanging forever like `synchronized`',
      '        if (!lock.tryLock(500, TimeUnit.MILLISECONDS)) {',
      '            return "BUSY_FALLBACK"; // Fail fast!',
      '        }',
      '        try {',
      '            // Critical section',
      '            return "PAYMENT_SUCCESS";',
      '        } finally {',
      '            // CRITICAL: Always unlock in finally even if an exception occurs!',
      '            lock.unlock();',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      'from threading import RLock',
      '',
      'class PaymentProcessor:',
      '    def __init__(self):',
      '        self._lock = RLock()',
      '',
      '    def process_with_timeout(self) -> str:',
      '        # Acquire with 0.5s timeout instead of blocking forever',
      '        acquired = self._lock.acquire(timeout=0.5)',
      '        if not acquired:',
      '            return "BUSY_FALLBACK"',
      '        try:',
      '            return "PAYMENT_SUCCESS"',
      '        finally:',
      '            self._lock.release()'
    ],
    scenarios: [
      {
        id: 'trylock-timeout-vs-sync',
        label: '1. Timed tryLock(500ms) Fallback vs Finally Block Unlock',
        summary: 'Thread-1 holds the lock during slow I/O; Thread-2 uses tryLock(500ms) to fail-fast gracefully instead of hanging forever.',
        steps: [
          {
            title: 'Step 1: Thread-1 Holds ReentrantLock; Thread-2 Calls tryLock(500ms)',
            explanation: 'Thread-1 is inside the critical section (AQS state = 1). Thread-2 calls lock.tryLock(500, MILLISECONDS) instead of blocking indefinitely.',
            status: 'info',
            activeArchNodes: ['t1', 't2', 'aqs', 'res'],
            activeArchEdge: { from: 't2', to: 'aqs', call: 'tryLock(500ms)' },
            domainGroups: [
              {
                title: 'ReentrantLock AQS State & Thread Status',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Holds Lock (Slow I/O)', badge: '🔒 OWNER', status: 'active' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Timer: 500ms max', badge: '⏱️ TIMED WAIT', status: 'warning' },
                  { id: 'q', label: 'AQS State', sublabel: 'state = 1 (Locked)', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Lock Owner', value: 'Thread-1' },
              { label: 'Thread-2 Call', value: 'tryLock(500ms)', changed: true }
            ],
            activeLinesJava: [5, 9],
            activeLinesPy: [5, 9]
          },
          {
            title: 'Step 2: 500ms Elapses → tryLock Returns false → Thread-2 Executes Fast Fallback!',
            explanation: 'Instead of freezing the web server thread forever (which happens with synchronized), tryLock() returns false at 500ms and Thread-2 returns BUSY_FALLBACK cleanly.',
            status: 'warning',
            activeArchNodes: ['aqs', 'fallback', 't2'],
            activeArchEdge: { from: 'aqs', to: 'fallback', call: 'Timeout → return BUSY_FALLBACK' },
            domainGroups: [
              {
                title: 'ReentrantLock AQS State & Thread Status',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Still finishing I/O', badge: '🔒 OWNER', status: 'active' },
                  { id: 'c2', label: 'Thread-2', sublabel: 'Returned BUSY_FALLBACK', badge: '⚡ FAIL-FAST ✓', status: 'success' },
                  { id: 'q', label: 'Server Health', sublabel: 'No hung thread pool!', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'tryLock Result', value: 'false (Timed out)', changed: true },
              { label: 'Thread-2 Response', value: 'BUSY_FALLBACK (No Hang!)', changed: true }
            ],
            activeLinesJava: [9, 10, 11],
            activeLinesPy: [9, 10, 11]
          },
          {
            title: 'Step 3: Thread-1 Finishes & Guaranteed finally { lock.unlock(); } Releases Lock',
            explanation: 'Thread-1 finishes work and executes the finally block, calling lock.unlock() to reset AQS state = 0 so future threads can acquire it.',
            status: 'success',
            activeArchNodes: ['t1', 'aqs', 'res'],
            activeArchEdge: { from: 'aqs', to: 'res', call: 'finally { lock.unlock() }' },
            domainGroups: [
              {
                title: 'ReentrantLock AQS State & Thread Status',
                layout: 'row',
                cells: [
                  { id: 'c1', label: 'Thread-1', sublabel: 'Unlocked in finally', badge: '✅ DONE', status: 'success' },
                  { id: 'q', label: 'AQS State', sublabel: 'state = 0 (Unlocked)', badge: '🟢 FREE', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'AQS State', value: '0 (Unlocked ✓)', changed: true },
              { label: 'Release Block', value: 'finally { unlock() }', changed: true }
            ],
            activeLinesJava: [14, 15, 17],
            activeLinesPy: [13, 14, 15]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 6. DEADLOCK / LIVELOCK / STARVATION
  // ===========================================================================
  'deadlock-livelock-starvation': {
    slug: 'deadlock-livelock-starvation',
    num: 6,
    title: 'Deadlock / Livelock / Starvation',
    category: 'concurrency',
    priority: 'Important',
    patterns: ['Coffman Deadlock Conditions', 'Global Lock Ordering (Break Circular Wait)', 'Timed Lock Backoff'],
    concurrencyNote: 'Break Circular Wait by Sorting Lock IDs Globally Before Acquiring!',
    analogy:
      '1) Deadlock: Alice holds the Bow and waits for Bob’s Arrow; Bob holds the Arrow and waits for Alice’s Bow—both stand frozen forever! 2) Livelock: Two polite people meet in a narrow hallway and both step left at the same time, then both step right—constantly moving (100% CPU) but making zero forward progress! 3) Starvation: One greedy VIP thread keeps cutting to the front of an unfair line while a low-priority thread waits forever.',
    requirements: [
      'Know the 4 Coffman conditions required for Deadlock: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
      'Eliminate Deadlock in money transfers (transfer(from, to)) by enforcing a deterministic Global Lock Order (always lock smaller accountId first!).',
      'Distinguish Deadlock (threads BLOCKED, 0% CPU) vs Livelock (threads RUNNING retries, 100% CPU) vs Starvation.'
    ],
    patternExplanations: [
      {
        pattern: 'Global Lock Ordering (Breaking Circular Wait)',
        why: 'If Thread-1 transfers A → B and Thread-2 transfers B → A, sorting by account.id ensures BOTH threads acquire Lock(A) first and Lock(B) second. Circular Wait becomes mathematically impossible!'
      },
      {
        pattern: 'Randomized Exponential Backoff for Livelock',
        why: 'When two threads use tryLock() and release upon conflict, adding a random jitter sleep (1..20ms) breaks their synchronized retry symmetry.'
      }
    ],
    edgeCases: [
      {
        title: 'Two accounts have the exact same System.identityHashCode() collision',
        solution: 'Use the unique primary key (account.id) for ordering, or fall back to a global tie-breaker lock when hashes collide.'
      }
    ],
    followUps: [
      {
        q: 'How do you detect a Deadlock in a running production JVM?',
        a: 'Run `jstack <pid>` or `ThreadMXBean.findDeadlockedThreads()`—it prints the exact cycle of threads and which monitor object each thread is holding and waiting to lock.'
      }
    ],
    archNodes: [
      { id: 't1', label: 'Thread-1', sublabel: 'transfer(A → B)', layer: 'client', x: 110, y: 72 },
      { id: 't2', label: 'Thread-2', sublabel: 'transfer(B → A)', layer: 'controller', x: 345, y: 72 },
      { id: 'order', label: 'Lock Orderer', sublabel: 'sort(id1, id2)', layer: 'pattern', x: 460, y: 172 },
      { id: 'lockA', label: 'Account A Lock', sublabel: 'ID = 101', layer: 'service', x: 645, y: 172 },
      { id: 'lockB', label: 'Account B Lock', sublabel: 'ID = 202', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 't1', to: 't2', label: 'opposite order' },
      { from: 't2', to: 'order', label: 'sort IDs' },
      { from: 'order', to: 'lockA', label: '1st: Lock A' },
      { from: 'lockA', to: 'lockB', label: '2nd: Lock B' },
      { from: 't2', to: 'lockB', label: 'grabs B first' }
    ],
    umlClasses: [
      {
        name: '1. Deadlock (BLOCKEDForever)',
        stereotype: 'state',
        role: 'T1 holds A waiting for B; T2 holds B waiting for A. Threads are frozen (0% CPU).',
        fields: ['Cause: Opposite lock acquisition order (A→B vs B→A)'],
        methods: ['Fix: Global Lock Ordering (always lock min(id) first)']
      },
      {
        name: '2. Livelock (100% CPU Retry Loop)',
        stereotype: 'state',
        role: 'Threads keep releasing and retrying in lockstep without completing.',
        fields: ['Cause: Symmetric retry timing without backoff'],
        methods: ['Fix: Random jitter sleep(random(1, 20) ms) between retries']
      },
      {
        name: '3. Starvation (Indefinite Delay)',
        stereotype: 'state',
        role: 'A runnable thread never gets CPU time or lock access because others jump ahead.',
        fields: ['Cause: Unfair locks or thread priority inversion'],
        methods: ['Fix: Fair lock new ReentrantLock(true)']
      }
    ],
    javaCode: [
      '// ❌ BROKEN: transfer(A, B) vs transfer(B, A) causes Circular Wait Deadlock!',
      'void transferBroken(Account from, Account to, int amt) {',
      '    synchronized (from) {            // T1 locks A, T2 locks B',
      '        synchronized (to) {          // T1 waits for B, T2 waits for A -> DEADLOCK!',
      '            from.balance -= amt; to.balance += amt;',
      '        }',
      '    }',
      '}',
      '',
      '// ✅ FIXED: Global Lock Ordering breaks Circular Wait completely',
      'public void transferSafe(Account from, Account to, int amt) {',
      '    Account first  = from.id < to.id ? from : to;',
      '    Account second = from.id < to.id ? to : from;',
      '    synchronized (first) {           // Both T1 and T2 try to lock Account A first!',
      '        synchronized (second) {      // Then Account B second -> Zero Deadlock!',
      '            from.balance -= amt;',
      '            to.balance += amt;',
      '        }',
      '    }',
      '}'
    ],
    pythonCode: [
      '# ❌ BROKEN: Locking in caller argument order deadlocks on transfer(A,B) + transfer(B,A)',
      'def transfer_broken(acc_from, acc_to, amt):',
      '    with acc_from.lock:',
      '        with acc_to.lock:  # DEADLOCK!',
      '            acc_from.balance -= amt; acc_to.balance += amt',
      '',
      '# ✅ FIXED: Sort locks by account ID so all threads acquire in identical order',
      'def transfer_safe(acc_from, acc_to, amt):',
      '    first, second = (acc_from, acc_to) if acc_from.id < acc_to.id else (acc_to, acc_from)',
      '    with first.lock:',
      '        with second.lock:',
      '            acc_from.balance -= amt',
      '            acc_to.balance += amt'
    ],
    scenarios: [
      {
        id: 'deadlock-circular-wait',
        label: '❌ Broken: Circular Wait Deadlock (T1 locks A→B, T2 locks B→A)',
        summary: 'Thread-1 locks Account A and waits for B, while Thread-2 locks Account B and waits for A—freezing both threads forever!',
        steps: [
          {
            title: 'Step 1: Thread-1 Locks Account A (101); Thread-2 Locks Account B (202)',
            explanation: 'Thread-1 calls transferBroken(A, B) and locks Account A. At the same millisecond, Thread-2 calls transferBroken(B, A) and locks Account B!',
            status: 'warning',
            activeArchNodes: ['t1', 't2', 'lockA', 'lockB'],
            activeArchEdge: { from: 't2', to: 'lockB', call: 'T1 locks A · T2 locks B' },
            domainGroups: [
              {
                title: 'Lock Ownership & Thread States',
                layout: 'row',
                cells: [
                  { id: 'la', label: 'Account A Lock', sublabel: 'Held by Thread-1', badge: '🔒 T1 OWNER', status: 'active' },
                  { id: 'lb', label: 'Account B Lock', sublabel: 'Held by Thread-2', badge: '🔒 T2 OWNER', status: 'warning' }
                ]
              }
            ],
            stateChips: [
              { label: 'Lock A (101)', value: 'Held by Thread-1', changed: true },
              { label: 'Lock B (202)', value: 'Held by Thread-2', changed: true }
            ],
            activeLinesJava: [2, 3],
            activeLinesPy: [2, 3]
          },
          {
            title: 'Step 2: T1 Waits for Lock B While T2 Waits for Lock A → Permanent DEADLOCK!',
            explanation: 'Thread-1 tries to enter synchronized(to = B) (held by T2). Thread-2 tries to enter synchronized(to = A) (held by T1). Neither can ever proceed!',
            status: 'error',
            activeArchNodes: ['t1', 't2', 'lockA', 'lockB'],
            activeArchEdge: { from: 'lockA', to: 'lockB', call: 'T1 waits B ⇄ T2 waits A (DEADLOCK!)' },
            domainGroups: [
              {
                title: 'Circular Wait Deadlock Detected!',
                layout: 'row',
                cells: [
                  { id: 't1', label: 'Thread-1', sublabel: 'Holds A · Waiting for B', badge: '🔴 DEADLOCKED', status: 'danger' },
                  { id: 't2', label: 'Thread-2', sublabel: 'Holds B · Waiting for A', badge: '🔴 DEADLOCKED', status: 'danger' }
                ]
              }
            ],
            stateChips: [
              { label: 'Thread-1', value: 'BLOCKED Forever on B', changed: true },
              { label: 'Thread-2', value: 'BLOCKED Forever on A', changed: true },
              { label: 'Cycle', value: '❌ T1 → B → T2 → A → T1', changed: true }
            ],
            activeLinesJava: [4],
            activeLinesPy: [4]
          }
        ]
      },
      {
        id: 'lock-ordering-fix',
        label: '✅ Fixed: Global Lock Ordering (Always Lock Smaller ID First)',
        summary: 'Both threads sort by ID (101 < 202) and contend for Account A first—eliminating Circular Wait!',
        steps: [
          {
            title: 'Step 1: Lock Orderer Sorts IDs (101 < 202) → Both Threads Request Lock A First!',
            explanation: 'Even though Thread-2 called transferSafe(B, A), first = min(101, 202) = Account A. Thread-1 acquires Lock A while Thread-2 waits before holding any lock!',
            status: 'info',
            activeArchNodes: ['t1', 't2', 'order', 'lockA'],
            activeArchEdge: { from: 'order', to: 'lockA', call: 'Both request Lock A (101) first' },
            domainGroups: [
              {
                title: 'Global Lock Ordering (first = A, second = B)',
                layout: 'row',
                cells: [
                  { id: 'la', label: '1st: Account A (101)', sublabel: 'Held by T1 (T2 waiting)', badge: '🔒 T1 OWNER', status: 'active' },
                  { id: 'lb', label: '2nd: Account B (202)', sublabel: 'FREE (Not held by T2!)', badge: '🟢 FREE', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Order Rule', value: 'ID 101 → ID 202' },
              { label: 'Lock A', value: 'Thread-1', changed: true },
              { label: 'Lock B', value: 'FREE (No Hold & Wait!)', changed: true }
            ],
            activeLinesJava: [12, 13, 14],
            activeLinesPy: [9, 10]
          },
          {
            title: 'Step 2: Thread-1 Acquires Lock B, Completes Transfer & Unlocks Both for Thread-2!',
            explanation: 'Because Lock B was free, Thread-1 acquires Lock B immediately, completes A → B, and unlocks both so Thread-2 can run B → A safely!',
            status: 'success',
            activeArchNodes: ['lockA', 'lockB'],
            activeArchEdge: { from: 'lockA', to: 'lockB', call: 'T1 locks B → Transfers → Unlocks ✓' },
            domainGroups: [
              {
                title: 'Global Lock Ordering (Both Transfers Succeed)',
                layout: 'row',
                cells: [
                  { id: 't1', label: 'Thread-1 (A → B)', sublabel: 'Completed & Unlocked', badge: '✅ DONE', status: 'success' },
                  { id: 't2', label: 'Thread-2 (B → A)', sublabel: 'Acquired A & B → Completed', badge: '✅ DONE', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Circular Wait', value: 'Impossible ✓', changed: true },
              { label: 'T1 & T2 Status', value: 'Both Completed ✓', changed: true }
            ],
            activeLinesJava: [15, 16, 17],
            activeLinesPy: [11, 12, 13]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 7. THREAD POOLS & EXECUTORSERVICE
  // ===========================================================================
  'thread-pools-executorservice': {
    slug: 'thread-pools-executorservice',
    num: 7,
    title: 'Thread Pools & ExecutorService',
    category: 'concurrency',
    priority: 'Must Know',
    patterns: ['ThreadPoolExecutor Lifecycle', 'Core Pool → WorkQueue → Max Pool → RejectionPolicy'],
    concurrencyNote: 'Never Use Unbounded Executors.newFixedThreadPool() in Production—Use Bounded ThreadPoolExecutor!',
    analogy:
      'Think of a bank branch with 2 regular tellers (corePoolSize = 2), 2 waiting chairs in the lobby (workQueue capacity = 2), and 1 backup manager desk that only opens during a rush (maxPoolSize = 3). Customers 1 & 2 go straight to the regular tellers. Customers 3 & 4 sit in the lobby chairs. Only when ALL chairs are full does Customer 5 cause the backup manager desk to open! If Customer 6 arrives when all 3 desks AND all 2 chairs are full, the security guard triggers the Rejection Policy.',
    requirements: [
      'Know the exact 4-stage task routing order in ThreadPoolExecutor: 1) Core Threads → 2) BlockingQueue → 3) Extra Threads up to maxPoolSize → 4) RejectedExecutionHandler.',
      'Understand why new Threads up to maxPoolSize are created ONLY AFTER the workQueue is completely full!',
      'Know the 4 Rejection Policies: AbortPolicy (throws exception), CallerRunsPolicy (backpressure), DiscardPolicy, DiscardOldestPolicy.'
    ],
    patternExplanations: [
      {
        pattern: 'Why Avoid Executors.newFixedThreadPool() & newCachedThreadPool()?',
        why: 'newFixedThreadPool uses an UNBOUNDED LinkedBlockingQueue (Integer.MAX_VALUE), which causes OutOfMemoryError during traffic spikes. newCachedThreadPool allows Integer.MAX_VALUE threads, crashing the OS with thread exhaustion. Always construct ThreadPoolExecutor explicitly with a bounded ArrayBlockingQueue!'
      },
      {
        pattern: 'CallerRunsPolicy for Graceful Backpressure',
        why: 'When the pool and queue are full, CallerRunsPolicy makes the submitting Tomcat/producer thread run the task itself—naturally slowing down incoming request ingestion without dropping data!'
      }
    ],
    edgeCases: [
      {
        title: 'Exception thrown inside executor.submit(Runnable) disappears silently!',
        solution: 'submit() wraps exceptions inside the returned Future (only thrown when you call future.get()). Use execute() or attach a custom ThreadFactory / UncaughtExceptionHandler.'
      }
    ],
    followUps: [
      {
        q: 'How do you size a thread pool for CPU-bound vs I/O-bound workloads?',
        a: 'CPU-bound: N_cores + 1 (avoids context-switch thrashing). I/O-bound: N_cores * (1 + WaitTime / ComputeTime), or use Java 21 Virtual Threads!'
      }
    ],
    archNodes: [
      { id: 'producer', label: 'Task Submitter', sublabel: 'pool.execute(task)', layer: 'client', x: 110, y: 72 },
      { id: 'core', label: '1. Core Threads', sublabel: 'corePoolSize = 2', layer: 'controller', x: 345, y: 72 },
      { id: 'queue', label: '2. WorkQueue', sublabel: 'ArrayBlockingQueue(2)', layer: 'pattern', x: 460, y: 172 },
      { id: 'max', label: '3. Max Burst Pool', sublabel: 'maxPoolSize = 3', layer: 'service', x: 645, y: 172 },
      { id: 'reject', label: '4. RejectPolicy', sublabel: 'CallerRuns / Abort', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'producer', to: 'core', label: 'Tasks 1..2' },
      { from: 'core', to: 'queue', label: 'Tasks 3..4' },
      { from: 'queue', to: 'max', label: 'Task 5 (Queue Full)' },
      { from: 'max', to: 'reject', label: 'Task 6 (All Full)' }
    ],
    umlClasses: [
      {
        name: 'ThreadPoolExecutor (4-Stage Routing Rule)',
        stereotype: 'class',
        role: 'Routes tasks strictly: Core Pool → WorkQueue → Max Pool → RejectionHandler.',
        fields: ['- corePoolSize: 2', '- workQueue: ArrayBlockingQueue(2)', '- maximumPoolSize: 3', '- keepAliveTime: 60s'],
        methods: ['+ execute(Runnable task): void']
      },
      {
        name: 'RejectedExecutionHandler',
        stereotype: 'strategy',
        role: 'Handles overload when both active threads == maxPoolSize AND workQueue is full.',
        fields: ['AbortPolicy (default: throws RejectedExecutionException)', 'CallerRunsPolicy (caller thread runs task -> backpressure)'],
        methods: ['+ rejectedExecution(Runnable r, ThreadPoolExecutor e): void']
      }
    ],
    javaCode: [
      'import java.util.concurrent.*;',
      '',
      'public class ProductionThreadPool {',
      '    // core=2, max=3, keepAlive=60s, bounded queue=2, CallerRuns backpressure',
      '    private final ThreadPoolExecutor pool = new ThreadPoolExecutor(',
      '        2,                                    // 1. corePoolSize',
      '        3,                                    // 3. maximumPoolSize',
      '        60L, TimeUnit.SECONDS,                // idle burst thread TTL',
      '        new ArrayBlockingQueue<>(2),          // 2. bounded workQueue (cap=2)',
      '        new ThreadPoolExecutor.CallerRunsPolicy() // 4. backpressure policy',
      '    );',
      '',
      '    public void submitBurst() {',
      '        // Tasks 1 & 2 -> start Core Threads 1 & 2',
      '        // Tasks 3 & 4 -> sit in ArrayBlockingQueue(2)',
      '        // Task 5      -> queue is FULL, so spawns 3rd thread (up to maxPoolSize=3)!',
      '        // Task 6      -> pool (3/3) + queue (2/2) full -> triggers CallerRunsPolicy!',
      '        for (int i = 1; i <= 6; i++) {',
      '            final int taskId = i;',
      '            pool.execute(() -> process(taskId));',
      '        }',
      '    }',
      '    private void process(int id) { /* work */ }',
      '}'
    ],
    pythonCode: [
      'from concurrent.futures import ThreadPoolExecutor',
      'from queue import Queue',
      '',
      '# Python ThreadPoolExecutor with bounded submission semaphore for backpressure',
      'class BoundedExecutor:',
      '    def __init__(self, max_workers=3, max_queue=2):',
      '        self.pool = ThreadPoolExecutor(max_workers=max_workers)',
      '        self.slots = Queue(maxsize=max_workers + max_queue)',
      '',
      '    def submit(self, fn, *args):',
      '        self.slots.put(1)  # Blocks caller if workers + queue are full',
      '        future = self.pool.submit(fn, *args)',
      '        future.add_done_callback(lambda _: self.slots.get())',
      '        return future'
    ],
    scenarios: [
      {
        id: 'four-stage-routing',
        label: '1. Complete 4-Stage Routing: Core (1..2) → Queue (3..4) → Max Thread (5) → Rejection (6)',
        summary: 'Traces 6 burst tasks arriving at ThreadPoolExecutor(core=2, queue=2, max=3) to prove the exact interview routing order.',
        steps: [
          {
            title: 'Step 1: Tasks 1 & 2 Arrive → Assigned Directly to Core Threads (2 / 2)',
            explanation: 'Since active threads (0) < corePoolSize (2), ThreadPoolExecutor spawns Core-Thread-1 and Core-Thread-2 immediately for Tasks 1 and 2.',
            status: 'info',
            activeArchNodes: ['producer', 'core'],
            activeArchEdge: { from: 'producer', to: 'core', call: 'Tasks 1 & 2 → Core Pool' },
            domainGroups: [
              {
                title: 'ThreadPoolExecutor State (core=2, queue=2, max=3)',
                layout: 'row',
                cells: [
                  { id: 'ct', label: '1. Core Threads', sublabel: 'T1(Task1), T2(Task2)', badge: '2 / 2 BUSY', status: 'active' },
                  { id: 'wq', label: '2. WorkQueue (Cap 2)', sublabel: '[ empty ]', badge: '0 / 2', status: 'default' },
                  { id: 'mt', label: '3. Extra Max Thread', sublabel: 'Not spawned yet', badge: '0 / 1', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Tasks Submitted', value: '1 & 2', changed: true },
              { label: 'Active Threads', value: '2 / 3 (Core Full)', changed: true },
              { label: 'Queue Size', value: '0 / 2' }
            ],
            activeLinesJava: [5, 6, 14, 20],
            activeLinesPy: [6, 7, 11, 12]
          },
          {
            title: 'Step 2: Tasks 3 & 4 Arrive → Placed in WorkQueue (Extra Thread NOT Spawned Yet!)',
            explanation: 'Interview Trap: When Core Threads are busy (2/2), Task 3 does NOT spawn a 3rd thread yet! Tasks 3 and 4 go into ArrayBlockingQueue(2) until the queue fills up.',
            status: 'info',
            activeArchNodes: ['core', 'queue'],
            activeArchEdge: { from: 'core', to: 'queue', call: 'Tasks 3 & 4 → WorkQueue' },
            domainGroups: [
              {
                title: 'ThreadPoolExecutor State (core=2, queue=2, max=3)',
                layout: 'row',
                cells: [
                  { id: 'ct', label: '1. Core Threads', sublabel: 'T1(Task1), T2(Task2)', badge: '2 / 2 BUSY', status: 'active' },
                  { id: 'wq', label: '2. WorkQueue (Cap 2)', sublabel: '[ Task 3, Task 4 ]', badge: '2 / 2 FULL!', status: 'warning' },
                  { id: 'mt', label: '3. Extra Max Thread', sublabel: 'Still 0 (Queue took them)', badge: '0 / 1', status: 'muted' }
                ]
              }
            ],
            stateChips: [
              { label: 'Tasks Submitted', value: '3 & 4', changed: true },
              { label: 'Active Threads', value: '2 / 3' },
              { label: 'Queue Size', value: '2 / 2 (FULL)', changed: true }
            ],
            activeLinesJava: [9, 15, 20],
            activeLinesPy: [8, 11]
          },
          {
            title: 'Step 3: Task 5 Arrives With WorkQueue Full → Spawns 3rd Burst Thread (maxPoolSize = 3)!',
            explanation: 'Now that BOTH Core Threads (2/2) AND WorkQueue (2/2) are full, Task 5 triggers creation of Burst-Thread-3 (reaching maximumPoolSize = 3)!',
            status: 'success',
            activeArchNodes: ['queue', 'max'],
            activeArchEdge: { from: 'queue', to: 'max', call: 'Queue Full → Spawn Thread-3!' },
            domainGroups: [
              {
                title: 'ThreadPoolExecutor State (core=2, queue=2, max=3)',
                layout: 'row',
                cells: [
                  { id: 'ct', label: '1. Core Threads', sublabel: 'T1(Task1), T2(Task2)', badge: '2 / 2 BUSY', status: 'active' },
                  { id: 'wq', label: '2. WorkQueue', sublabel: '[ Task 3, Task 4 ]', badge: '2 / 2 FULL', status: 'warning' },
                  { id: 'mt', label: '3. Extra Max Thread', sublabel: 'T3 running Task 5!', badge: '1 / 1 SPAWNED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Task 5 Route', value: 'Spawned Thread-3', changed: true },
              { label: 'Active Threads', value: '3 / 3 (MAX)', changed: true },
              { label: 'Queue Size', value: '2 / 2 (FULL)' }
            ],
            activeLinesJava: [7, 16, 20],
            activeLinesPy: [7, 12]
          },
          {
            title: 'Step 4: Task 6 Arrives When Max Threads (3/3) & Queue (2/2) Are Full → RejectionPolicy!',
            explanation: 'All 3 threads are busy and all 2 queue slots are full. Task 6 triggers RejectedExecutionHandler (CallerRunsPolicy runs Task 6 on the caller thread to apply backpressure!).',
            status: 'warning',
            activeArchNodes: ['max', 'reject'],
            activeArchEdge: { from: 'max', to: 'reject', call: 'Task 6 → CallerRunsPolicy!' },
            domainGroups: [
              {
                title: 'ThreadPoolExecutor Saturated → Rejection Policy Triggered',
                layout: 'row',
                cells: [
                  { id: 'all', label: 'Pool + Queue Saturated', sublabel: '3 Threads + 2 Queued = 5', badge: '100% FULL', status: 'danger' },
                  { id: 'rej', label: '4. CallerRunsPolicy', sublabel: 'Caller thread executes Task 6', badge: 'BACKPRESSURE ✓', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Task 6 Route', value: 'RejectedExecutionHandler', changed: true },
              { label: 'Policy Action', value: 'CallerRuns (Zero Data Loss)', changed: true }
            ],
            activeLinesJava: [10, 17, 20],
            activeLinesPy: [11]
          }
        ]
      }
    ]
  },

  // ===========================================================================
  // 8. BLOCKINGQUEUE
  // ===========================================================================
  'blocking-queue': {
    slug: 'blocking-queue',
    num: 8,
    title: 'BlockingQueue',
    category: 'concurrency',
    priority: 'Important',
    patterns: ['Producer–Consumer Pattern', 'One ReentrantLock + Two Conditions (notFull & notEmpty)'],
    concurrencyNote: 'Always Check Buffer State in a while() Loop Around await() to Guard Against Spurious Wakeups!',
    analogy:
      'Think of a bakery counter shelf that holds at most 2 loaves of bread. The Baker (Producer) bakes loaves and puts them on the shelf. When the shelf has 2 loaves (Full!), the Baker goes to sleep in the "notFull" chair. When a Customer (Consumer) takes a loaf from the shelf, they ring the "notFull" bell to wake the Baker back up!',
    requirements: [
      'Implement a bounded thread-safe FIFO buffer with put(item) and take().',
      'put(item) blocks when count == capacity using Condition notFull.await().',
      'take() blocks when count == 0 using Condition notEmpty.await().',
      'Use while (count == capacity) instead of if to protect against spurious wakeups.'
    ],
    patternExplanations: [
      {
        pattern: 'Two Condition Queues (notFull & notEmpty) on One ReentrantLock',
        why: 'When a Consumer takes an item from a full queue, calling notFull.signal() wakes ONLY a waiting Producer thread—never wasting CPU waking up another Consumer thread!'
      },
      {
        pattern: 'Why `while (count == cap)` Instead of `if (count == cap)`?',
        why: 'OS threads can experience "spurious wakeups" (waking from await() without a signal) or another producer can grab the slot before the woken thread re-acquires the lock. Re-checking in a while loop guarantees the invariant holds.'
      }
    ],
    edgeCases: [
      {
        title: 'Using signal() vs signalAll() with a single wait queue',
        solution: 'With separate notFull and notEmpty Conditions, single-thread signal() is safe and avoids the "thundering herd" problem of notifyAll().'
      }
    ],
    followUps: [
      {
        q: 'How does LinkedBlockingQueue achieve higher throughput than ArrayBlockingQueue?',
        a: 'ArrayBlockingQueue uses a single ReentrantLock for both put() and take(). LinkedBlockingQueue uses TWO separate locks (putLock on tail and takeLock on head) plus an AtomicInteger count, so Producers and Consumers run in parallel!'
      }
    ],
    archNodes: [
      { id: 'prod', label: 'Producer Thread', sublabel: 'queue.put(item)', layer: 'client', x: 110, y: 72 },
      { id: 'lock', label: 'ReentrantLock', sublabel: 'Guards Buffer', layer: 'controller', x: 345, y: 72 },
      { id: 'cond', label: 'notFull / notEmpty', sublabel: 'await() / signal()', layer: 'pattern', x: 460, y: 172 },
      { id: 'cons', label: 'Consumer Thread', sublabel: 'queue.take()', layer: 'service', x: 645, y: 172 },
      { id: 'buf', label: 'Circular Buffer', sublabel: 'Object[cap = 2]', layer: 'storage', x: 745, y: 72 }
    ],
    archEdges: [
      { from: 'prod', to: 'lock', label: 'put(x)' },
      { from: 'lock', to: 'buf', label: 'enqueue' },
      { from: 'lock', to: 'cond', label: 'full → await()' },
      { from: 'cons', to: 'buf', label: 'take() item' },
      { from: 'cons', to: 'cond', label: 'notFull.signal()' }
    ],
    umlClasses: [
      {
        name: 'BoundedBlockingQueue<T>',
        stereotype: 'class',
        role: 'Thread-safe circular array queue coordinating producers and consumers.',
        fields: [
          '- items: Object[]',
          '- lock: ReentrantLock',
          '- notFull: Condition = lock.newCondition()',
          '- notEmpty: Condition = lock.newCondition()'
        ],
        methods: ['+ put(x: T): void', '+ take(): T']
      }
    ],
    javaCode: [
      'import java.util.concurrent.locks.*;',
      '',
      'public class BoundedBlockingQueue<T> {',
      '    private final Queue<T> queue = new ArrayDeque<>();',
      '    private final int cap;',
      '    private final ReentrantLock lock = new ReentrantLock();',
      '    private final Condition notFull = lock.newCondition();',
      '    private final Condition notEmpty = lock.newCondition();',
      '',
      '    public BoundedBlockingQueue(int capacity) { this.cap = capacity; }',
      '',
      '    public void put(T item) throws InterruptedException {',
      '        lock.lock();',
      '        try {',
      '            while (queue.size() == cap) {',
      '                notFull.await(); // Releases lock & sleeps until Consumer takes!',
      '            }',
      '            queue.offer(item);',
      '            notEmpty.signal();   // Wake 1 waiting Consumer',
      '        } finally { lock.unlock(); }',
      '    }',
      '    public T take() throws InterruptedException {',
      '        lock.lock();',
      '        try {',
      '            while (queue.isEmpty()) notEmpty.await();',
      '            T item = queue.poll();',
      '            notFull.signal();    // Wake 1 waiting Producer',
      '            return item;',
      '        } finally { lock.unlock(); }',
      '    }',
      '}'
    ],
    pythonCode: [
      'from collections import deque',
      'from threading import Lock, Condition',
      '',
      'class BoundedBlockingQueue:',
      '    def __init__(self, capacity: int):',
      '        self.cap = capacity',
      '        self.queue = deque()',
      '        self._lock = Lock()',
      '        self.not_full = Condition(self._lock)',
      '        self.not_empty = Condition(self._lock)',
      '',
      '    def put(self, item) -> None:',
      '        with self._lock:',
      '            while len(self.queue) == self.cap:',
      '                self.not_full.wait()',
      '            self.queue.append(item)',
      '            self.not_empty.notify()',
      '',
      '    def take(self):',
      '        with self._lock:',
      '            while not self.queue:',
      '                self.not_empty.wait()',
      '            item = self.queue.popleft()',
      '            self.not_full.notify()',
      '            return item'
    ],
    scenarios: [
      {
        id: 'full-buffer-await-signal',
        label: '1. Complete Flow: Fill Buffer (2/2) → 3rd put() Blocks on notFull.await() → Consumer take() Wakes Producer',
        summary: 'Traces a Producer filling a 2-slot buffer, blocking on the 3rd item, and waking up when the Consumer calls take().',
        steps: [
          {
            title: 'Step 1: Producer Puts Job-A & Job-B → Buffer Reaches Full Capacity (2 / 2)',
            explanation: 'Producer calls put("Job-A") and put("Job-B"). Both are added to Circular Buffer and notEmpty.signal() is called. Buffer size is now 2 / 2 (Full).',
            status: 'info',
            activeArchNodes: ['prod', 'lock', 'buf'],
            activeArchEdge: { from: 'lock', to: 'buf', call: 'put(Job-A), put(Job-B)' },
            domainGroups: [
              {
                title: 'Circular Buffer (Cap = 2) & Condition Wait Queues',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'Slot 0: Job-A', sublabel: 'Occupied', badge: 'FULL', status: 'active' },
                  { id: 'b2', label: 'Slot 1: Job-B', sublabel: 'Occupied', badge: 'FULL', status: 'active' },
                  { id: 'nf', label: 'notFull Waiters', sublabel: '[ empty ]', status: 'default' }
                ]
              }
            ],
            stateChips: [
              { label: 'Buffer Size', value: '2 / 2 (Full)', changed: true },
              { label: 'Producer', value: 'RUNNING' },
              { label: 'notFull Queue', value: '[]' }
            ],
            activeLinesJava: [12, 13, 18, 19],
            activeLinesPy: [12, 13, 16, 17]
          },
          {
            title: 'Step 2: Producer Calls put("Job-C") on Full Buffer → Parks in notFull.await()!',
            explanation: 'While queue.size() == 2, Producer enters notFull.await()! This atomically releases the ReentrantLock and parks the Producer thread in WAITING state.',
            status: 'warning',
            activeArchNodes: ['prod', 'lock', 'cond'],
            activeArchEdge: { from: 'lock', to: 'cond', call: 'size==2 → notFull.await()' },
            domainGroups: [
              {
                title: 'Circular Buffer (Cap = 2) & Condition Wait Queues',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'Slot 0: Job-A', sublabel: 'Occupied', status: 'default' },
                  { id: 'b2', label: 'Slot 1: Job-B', sublabel: 'Occupied', status: 'default' },
                  { id: 'nf', label: 'notFull Condition', sublabel: 'Producer Parked (Job-C)', badge: '🟣 AWAITING', status: 'warning' }
                ]
              }
            ],
            stateChips: [
              { label: 'Buffer Size', value: '2 / 2 (Full)' },
              { label: 'Producer State', value: 'WAITING (Lock Released)', changed: true },
              { label: 'Pending Item', value: 'Job-C', changed: true }
            ],
            activeLinesJava: [15, 16],
            activeLinesPy: [14, 15]
          },
          {
            title: 'Step 3: Consumer Calls take() → Pops Job-A & Signals notFull.signal()!',
            explanation: 'Consumer acquires the lock, polls Job-A (freeing 1 slot), and calls notFull.signal(). Producer wakes up from await(), re-checks the while loop (1 < 2), and inserts Job-C!',
            status: 'success',
            activeArchNodes: ['cons', 'buf', 'cond'],
            activeArchEdge: { from: 'cons', to: 'cond', call: 'take() → notFull.signal()!' },
            domainGroups: [
              {
                title: 'Circular Buffer After Consumer take() & Producer Wakeup',
                layout: 'row',
                cells: [
                  { id: 'b1', label: 'Slot 0: Job-B', sublabel: 'Shifted front', status: 'default' },
                  { id: 'b2', label: 'Slot 1: Job-C', sublabel: 'Inserted by woken Producer!', badge: '✅ ENQUEUED', status: 'success' },
                  { id: 'c', label: 'Consumer Thread', sublabel: 'Received Job-A', badge: '✅ CONSUMED', status: 'success' }
                ]
              }
            ],
            stateChips: [
              { label: 'Consumed', value: 'Job-A ✓', changed: true },
              { label: 'Producer Woken', value: 'Inserted Job-C ✓', changed: true },
              { label: 'Buffer Size', value: '2 / 2 ([Job-B, Job-C])' }
            ],
            activeLinesJava: [18, 25, 26, 27, 28],
            activeLinesPy: [16, 21, 23, 24, 25]
          }
        ]
      }
    ]
  }
};
