# ProposalList Component - Debug Analysis and Fix

## Problem Description

The `ProposalList` component was appearing and disappearing from the screen, causing a flickering effect and poor user experience.

## Root Cause Analysis

### Primary Issues Identified

1. **No Contract Deployment Verification**

   - The component attempted to read proposals without first verifying if the contract was deployed
   - When the contract wasn't deployed, all contract calls failed, but the component kept retrying
   - This caused continuous re-renders and state changes

2. **Uncontrolled useEffect Execution**

   - The `useEffect` hook executed on every `refreshTrigger` change without checking contract availability
   - Even when the contract wasn't deployed, the effect would attempt to read proposals
   - No cleanup mechanism to prevent race conditions

3. **Poor Error Handling**

   - Errors from contract calls weren't properly categorized (contract not deployed vs. network issues)
   - The component didn't distinguish between "no proposals" and "contract not deployed"
   - Error states weren't properly managed, causing UI flickering

4. **Missing State Management**

   - No state to track whether the contract is deployed
   - No mechanism to prevent multiple simultaneous proposal fetching operations
   - No cleanup on component unmount

5. **ProposalCard Component Issues**
   - `useProposal` hook didn't validate contract deployment
   - ProposalCard would mount/unmount when proposal data was undefined
   - No loading states, causing visual flickering

## Solution Implemented

### 1. Contract Deployment Verification

Added a separate `useEffect` that runs once on mount to verify contract deployment:

```typescript
useEffect(() => {
  const verifyContract = async () => {
    // Check contract address configuration
    // Verify contract has code on blockchain
    // Set contractDeployed state
  };
  verifyContract();
}, []); // Only run once on mount
```

### 2. Conditional Proposal Fetching

The proposal fetching `useEffect` now only runs if the contract is verified as deployed:

```typescript
useEffect(() => {
  // Don't run if contract is not deployed or verification is pending
  if (contractDeployed === false || contractDeployed === null) {
    return;
  }
  // ... fetch proposals
}, [refreshTrigger, contractDeployed]);
```

### 3. Error Detection and Handling

Added helper function to detect contract not deployed errors:

```typescript
function isContractNotDeployedError(error: unknown): boolean {
  // Detects various error messages indicating contract not deployed
}
```

### 4. Race Condition Prevention

Implemented cleanup and cancellation mechanisms:

```typescript
let cancelled = false;
const isMountedRef = useRef(true);

// Check cancellation before state updates
if (!cancelled && isMountedRef.current) {
  setProposalIds(found);
  setLoading(false);
}

return () => {
  cancelled = true;
};
```

### 5. Improved useProposal Hook

Updated `useProposal` to:

- Check contract address before enabling queries
- Disable retries for contract not deployed errors
- Disable auto-refetch (only manual refresh)
- Return error and loading states

### 6. Enhanced ProposalCard

Updated `ProposalCard` to:

- Handle contract not deployed errors gracefully (return null)
- Show loading state while fetching
- Prevent unnecessary renders

## Key Changes

### ProposalList.tsx

1. **Added contract verification state**: `contractDeployed` (boolean | null)
2. **Added error state**: `error` (string | null)
3. **Added mount tracking**: `isMountedRef` to prevent state updates after unmount
4. **Two-phase useEffect**:
   - First: Verify contract deployment (runs once)
   - Second: Fetch proposals (only if contract deployed)
5. **Proper cleanup**: Cancellation flags and unmount tracking
6. **Error UI**: Shows helpful message when contract not deployed

### useDAO.ts (useProposal)

1. **Added error handling**: Returns error state
2. **Added loading state**: Returns isLoading
3. **Contract validation**: Checks `CONTRACTS.DAO_VOTING !== "0x0"`
4. **Retry logic**: Doesn't retry for contract not deployed errors
5. **No auto-refetch**: Proposals only refresh manually

### ProposalCard.tsx

1. **Error handling**: Returns null if contract not deployed
2. **Loading state**: Shows loading indicator
3. **Null checks**: Proper handling of undefined/null proposals

## Testing Scenarios

### Scenario 1: Contract Not Deployed

- **Before**: Component flickered, attempted to read proposals repeatedly
- **After**: Shows clear error message with deployment instructions

### Scenario 2: Contract Deployed, No Proposals

- **Before**: Worked correctly
- **After**: Still works, shows "No hay propuestas disponibles"

### Scenario 3: Contract Deployed, Has Proposals

- **Before**: Worked but could flicker on errors
- **After**: Stable rendering, no flickering

### Scenario 4: Anvil Restarted (Contract Lost)

- **Before**: Component would keep trying and flickering
- **After**: Detects contract loss, shows error message

## Performance Improvements

1. **Reduced unnecessary renders**: Contract verification prevents unnecessary proposal fetching
2. **Prevented race conditions**: Cleanup mechanisms prevent state updates after unmount
3. **Better error handling**: Errors are caught and handled gracefully
4. **Stable UI**: No more flickering or disappearing components

## Files Modified

1. `web/components/ProposalList.tsx` - Main fixes
2. `web/hooks/useDAO.ts` - Enhanced useProposal hook
3. `web/components/ProposalCard.tsx` - Better error handling

## Verification

To verify the fix works:

1. **Without contract deployed**: Component should show error message, not flicker
2. **With contract deployed**: Component should load proposals normally
3. **After Anvil restart**: Component should detect contract loss and show error
4. **After redeployment**: Component should detect new contract and load proposals
