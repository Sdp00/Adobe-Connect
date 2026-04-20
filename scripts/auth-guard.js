import { isSignedInUser } from './auth.js';

// export const withAuth = (fn) => async (...args) => {
//   const isSignedIn = await isSignedInUser();

//   if (!isSignedIn) {
//     window?.adobeIMS?.signIn();
//     return;
//   }

//   return fn(...args);
// };

const withAuth = (fn) => async (...args) => {
  const isSignedIn = await isSignedInUser();

  if (!isSignedIn) {
    window?.adobeIMS?.signIn();
    return undefined; // explicit
  }

  return fn(...args); // explicit async return
};

export default withAuth;
