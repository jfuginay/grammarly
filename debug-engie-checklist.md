# Engie Visibility Debug Checklist

## Step 1: Check if Engie is visible
1. Go to http://localhost:3000/dashboard
2. Create or select a document
3. Look for the **Engie bot** in the bottom-right corner
4. If you see it: The component is working correctly
5. If you don't see it: There's a fundamental rendering issue

## Step 2: Check Browser Console
Open Developer Tools (F12) and look for:
- [ ] "Dashboard state update:" messages
- [ ] Any JavaScript errors (red text)
- [ ] "Calculating initial position:" messages
- [ ] Engie-related console logs

## Step 3: Check DOM Elements
In Developer Tools Elements tab, search for:
- [ ] `engie-container` (should exist if Engie renders)
- [ ] Elements with `position: fixed` and high z-index
- [ ] Engie-related class names

## Step 4: Check Network Tab
- [ ] No failed requests for CSS/JS files
- [ ] All components loading successfully

## Step 5: Check CSS Issues
- [ ] Look for any CSS that might hide fixed positioned elements
- [ ] Check if there's a global `overflow: hidden` on body/html
- [ ] Verify z-index isn't being overridden

## Step 6: Check React DevTools
If you have React DevTools installed:
- [ ] Look for `EngieBot` component in component tree
- [ ] Check if components are mounting/unmounting unexpectedly

## Common Issues & Solutions

### Issue: Engie not visible
**Solution**: Check console for errors and verify component mounting

### Issue: Components in React DevTools but not visible
**Solution**: CSS/positioning issue - check computed styles

### Issue: Console shows errors
**Solution**: Fix JavaScript errors first

## Next Steps Based on Results

### If Engie IS visible:
- The component is working correctly
- Check for any interaction issues

### If Engie is NOT visible:
- There's a broader issue with fixed positioning or React rendering
- Check for global CSS that might interfere
- Check if the dashboard layout is preventing fixed positioning
- Verify the component is actually being rendered in the DOM

## Quick Tests to Run

1. **Test 1**: Can you interact with the Engie bot?
2. **Test 2**: Do you see console messages when navigating to dashboard?
3. **Test 3**: Check if the component is in the DOM but hidden by CSS 