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
