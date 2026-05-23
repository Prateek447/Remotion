export const insertAtHeadCode = `public void insertAtHead(int val) {
    Node newNode = new Node(val);
    newNode.next = head;
    head = newNode;
    size++;
}`;

export const insertAtTailCode = `public void insertAtTail(int val) {
    Node newNode = new Node(val);
    if (head == null) {
        head = newNode;
        return;
    }
    Node curr = head;
    while (curr.next != null) {
        curr = curr.next;
    }
    curr.next = newNode;
    size++;
}`;

export const deleteNodeCode = `public void delete(int val) {
    if (head == null) return;
    if (head.val == val) {
        head = head.next;
        return;
    }
    Node curr = head;
    while (curr.next != null) {
        if (curr.next.val == val) {
            curr.next = curr.next.next;
            return;
        }
        curr = curr.next;
    }
}`;

export const searchNodeCode = `public boolean search(int val) {
    Node curr = head;
    while (curr != null) {
        if (curr.val == val) {
            return true;
        }
        curr = curr.next;
    }
    return false;
}`;

export const traverseCode = `public void traverse() {
    Node curr = head;
    while (curr != null) {
        System.out.print(curr.val + " -> ");
        curr = curr.next;
    }
    System.out.println("null");
}`;

export const reverseCode = `public void reverse() {
    Node prev = null;
    Node curr = head;
    while (curr != null) {
        Node next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    head = prev;
}`;

export const detectCycleCode = `public boolean hasCycle() {
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}`;

export const mergeSortedCode = `public static Node mergeSorted(Node a, Node b) {
    Node dummy = new Node(0);
    Node tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) {
            tail.next = a;
            a = a.next;
        } else {
            tail.next = b;
            b = b.next;
        }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}`;

export const removeNthNaiveCode = `public ListNode removeNthFromEnd(ListNode head, int n) {
    int length = 0;
    ListNode curr = head;
    while (curr != null) {
        length++;
        curr = curr.next;
    }
    int target = length - n;
    if (target == 0) return head.next;
    curr = head;
    for (int i = 0; i < target - 1; i++) {
        curr = curr.next;
    }
    curr.next = curr.next.next;
    return head;
}`;

export const removeNthOptimalCode = `public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode fast = dummy;
    ListNode slow = dummy;
    for (int i = 0; i <= n; i++) {
        fast = fast.next;
    }
    while (fast != null) {
        slow = slow.next;
        fast = fast.next;
    }
    slow.next = slow.next.next;
    return dummy.next;
}`;

export const linearSearchCode = `int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`;

export const binarySearchCode = `int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`;

export const bubbleSortCode = `void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}`;

export const mergeSortCode = `void mergeSort(int[] arr, int l, int r) {
    if (l >= r) return;
    int mid = l + (r - l) / 2;
    mergeSort(arr, l, mid);
    mergeSort(arr, mid + 1, r);
    merge(arr, l, mid, r);
}`;

export const fibonacciCode = `int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`;

export const permutationsCode = `void permute(int[] arr, int start) {
    if (start == arr.length) {
        print(arr);
        return;
    }
    for (int i = start; i < arr.length; i++) {
        swap(arr, start, i);
        permute(arr, start + 1);
        swap(arr, start, i);
    }
}`;

export const topViewCode = `public List<Integer> topView(TreeNode root) {
    if (root == null) return List.of();
    TreeMap<Integer, Integer> colMap = new TreeMap<>();
    Map<TreeNode, Integer> colOf = new HashMap<>();
    Queue<TreeNode> q = new LinkedList<>();
    colOf.put(root, 0);
    q.add(root);
    while (!q.isEmpty()) {
        TreeNode node = q.poll();
        int col = colOf.get(node);
        colMap.putIfAbsent(col, node.val);
        if (node.left != null) {
            colOf.put(node.left, col - 1);
            q.add(node.left);
        }
        if (node.right != null) {
            colOf.put(node.right, col + 1);
            q.add(node.right);
        }
    }
    return new ArrayList<>(colMap.values());
}`;

export const leftViewCode = `public List<Integer> leftView(TreeNode root) {
    if (root == null) return List.of();
    List<Integer> res = new ArrayList<>();
    Queue<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            if (i == 0) res.add(node.val);
            if (node.left  != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
    }
    return res;
}`;

export const rightViewCode = `public List<Integer> rightView(TreeNode root) {
    if (root == null) return List.of();
    List<Integer> res = new ArrayList<>();
    Queue<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            if (i == size - 1) res.add(node.val);
            if (node.left  != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
    }
    return res;
}`;

export const boundaryCode = `List<Integer> boundary(TreeNode root) {
    if (root == null) return List.of();
    List<Integer> res = new ArrayList<>();
    if (root.left != null || root.right != null)
        res.add(root.val);
    addLeft(root.left, res);
    addLeaves(root, res);
    addRight(root.right, res);
    return res;
}

// left boundary (top-down, skip leaves)
void addLeft(TreeNode n, List<Integer> res) {
    if (n == null ||
        (n.left == null && n.right == null)) return;
    res.add(n.val);
    addLeft(n.left != null ? n.left : n.right, res);
}

// collect all leaves (DFS)
void addLeaves(TreeNode n, List<Integer> res) {
    if (n == null) return;
    if (n.left == null && n.right == null) {
        res.add(n.val); return;
    }
    addLeaves(n.left, res);
    addLeaves(n.right, res);
}

// right boundary (bottom-up, post-order)
void addRight(TreeNode n, List<Integer> res) {
    if (n == null ||
        (n.left == null && n.right == null)) return;
    addRight(n.right != null ? n.right : n.left, res);
    res.add(n.val);
}`;

export const bstInsertCode = `public void insert(int val) {
    root = insertRec(root, val);
}

Node insertRec(Node node, int val) {
    if (node == null)
        return new Node(val);
    if (val < node.val)
        node.left = insertRec(node.left, val);
    else if (val > node.val)
        node.right = insertRec(node.right, val);
    return node;
}`;


export const towerOfHanoiCode = `void hanoi(int n, char src, char dst, char via) {
    if (n == 0) return;
    hanoi(n - 1, src, via, dst);
    System.out.println(src + " → " + dst);
    hanoi(n - 1, via, dst, src);
}`;

export const diagonalCode = `public List<List<Integer>> diagonal(TreeNode root) {
    if (root == null) return List.of();
    List<List<Integer>> result = new ArrayList<>();
    Queue<TreeNode> q = new LinkedList<>();
    q.add(root);
    // one pass = one diagonal
    while (!q.isEmpty()) {
        List<Integer> row = new ArrayList<>();
        List<TreeNode> nextQ = new ArrayList<>();
        while (!q.isEmpty()) {
            TreeNode node = q.poll();
            while (node != null) {
                row.add(node.val);
                // left child = start of next diagonal
                if (node.left != null)
                    nextQ.add(node.left);
                // right child = stay on same diagonal
                node = node.right;
            }
        }
        result.add(row);
        // promote nextQ → next queue
        q.addAll(nextQ);
    }
    return result;
}`;

export const rtlDiagonalCode = `public List<List<Integer>> diagonalRL(TreeNode root) {
    if (root == null) return List.of();
    List<List<Integer>> result = new ArrayList<>();
    Queue<TreeNode> q = new LinkedList<>();
    q.add(root);
    // one pass = one diagonal
    while (!q.isEmpty()) {
        List<Integer> row = new ArrayList<>();
        List<TreeNode> nextQ = new ArrayList<>();
        while (!q.isEmpty()) {
            TreeNode node = q.poll();
            while (node != null) {
                row.add(node.val);
                // right child = start of next diagonal
                if (node.right != null)
                    nextQ.add(node.right);
                // left child = stay on same diagonal
                node = node.left;
            }
        }
        result.add(row);
        // promote nextQ → next queue
        q.addAll(nextQ);
    }
    return result;
}`;

export const levelOrderCode = `public List<Integer> levelOrder(TreeNode root) {
  List<Integer> result = new ArrayList<>();
  if (root == null) return result;
  Queue<TreeNode> queue = new LinkedList<>();
  queue.offer(root);
  while (!queue.isEmpty()) {
    TreeNode node = queue.poll();
    result.add(node.val);
    if (node.left != null) queue.offer(node.left);
    if (node.right != null) queue.offer(node.right);
  }
  return result;
}`;