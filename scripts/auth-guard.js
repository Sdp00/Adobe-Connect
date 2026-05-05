import { isSignedInUser } from './auth.js';

const withAuth = (fn) => async (...args) => {
  const isSignedIn = await isSignedInUser();

  if (!isSignedIn) {
    window?.adobeIMS?.signIn();
    return undefined;
  }

  return fn(...args); // explicit async return
};

export default withAuth;
