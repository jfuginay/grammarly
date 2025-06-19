# Engie Visibility Debug Checklist

## Step 1: Check if SimpleEngieTest is visible
1. Go to http://localhost:3000/dashboard
2. Create or select a document
3. Look for a **RED CIRCLE with "TEST"** in the bottom-right corner
4. If you see it: The issue is with the complex Engie component
5. If you don't see it: There's a fundamental rendering issue

## Step 2: Check Browser Console
Open Developer Tools (F12) and look for:
- [ ] "SimpleEngieTest is rendering!" message
- [ ] "Dashboard state update:" messages
- [ ] Any JavaScript errors (red text)
- [ ] "Calculating initial position:" messages

## Step 3: Check DOM Elements
In Developer Tools Elements tab, search for:
- [ ] `SimpleEngieTest` (should exist if component renders)
- [ ] `engie-container` (should exist if Engie renders)
- [ ] Elements with `position: fixed` and high z-index

## Step 4: Check Network Tab
- [ ] No failed requests for CSS/JS files
- [ ] All components loading successfully

## Step 5: Check CSS Issues
- [ ] Look for any CSS that might hide fixed positioned elements
- [ ] Check if there's a global `overflow: hidden` on body/html
- [ ] Verify z-index isn't being overridden

## Step 6: Check React DevTools
If you have React DevTools installed:
- [ ] Look for `SimpleEngieTest` component in component tree
- [ ] Look for `EngieBot` component in component tree
- [ ] Check if components are mounting/unmounting unexpectedly

## Common Issues & Solutions

### Issue: Red test circle visible but original Engie not visible
**Solution**: Problem is with the complex Engie component (CSS modules, animations, or Draggable)

### Issue: No red test circle visible
**Solution**: Fundamental rendering issue - check console for errors

### Issue: Components in React DevTools but not visible
**Solution**: CSS/positioning issue - check computed styles

### Issue: Console shows errors
**Solution**: Fix JavaScript errors first

## Next Steps Based on Results

### If SimpleEngieTest IS visible:
- The issue is with the original Engie component
- We'll simplify the Engie component step by step
- Check CSS modules loading
- Check Draggable library integration

### If SimpleEngieTest is NOT visible:
- There's a broader issue with fixed positioning or React rendering
- Check for global CSS that might interfere
- Check if the dashboard layout is preventing fixed positioning
- Verify the component is actually being rendered in the DOM

## Quick Tests to Run

1. **Test 1**: Can you click the red circle and get an alert?
2. **Test 2**: Do you see console messages when navigating to dashboard?
3. **Test 3**: Does the test HTML file (`test-engie-visibility.html`) show a purple circle when opened directly? 