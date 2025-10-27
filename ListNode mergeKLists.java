class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        List<ListNode> tempList=new ArrayList<>();
        for(int i=0;i<lists.length;i++) {
            ListNode temp=lists[i];
            while(temp!=null) {
                tempList.add(temp);
                temp=temp.next;
            }
        }
        if(tempList.isEmpty()) return null;
        for(int i=(tempList.size()-1)/2;i>=0;i--) {
            heapify(tempList, i);
        }
        ListNode dummy=new ListNode(0);
        ListNode tail=dummy;
        while(!tempList.isEmpty()) {
            ListNode min=tempList.get(0);
            tail.next=min;
            tail=tail.next;
            ListNode last=tempList.remove(tempList.size()-1);
            if(!tempList.isEmpty()) {
                tempList.set(0,last);
                heapify(tempList,0);
            }
        }
        tail.next=null;
        return dummy.next;
    }
    void heapify(List<ListNode> nums, int i) {
        int l=2*i+1, r=2*i+2, min=i;
        if(l<nums.size() && nums.get(l).val<nums.get(min).val) min=l;
        if(r<nums.size() && nums.get(r).val<nums.get(min).val) min=r;
        if(min!=i) {
            ListNode temp=nums.get(i);
            nums.set(i,nums.get(min));
            nums.set(min,temp);
            heapify(nums, min);
        }
    }
}
