export default function getUserInfo() {
  const user = window.currentUser;

  if (!user) {
    return {
      name: 'Guest',
      initials: 'NA',
      email: '',
    };
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)
      .toUpperCase()
    : 'NA';

  return {
    name: fullName || 'User',
    initials,
    email: user.email || '',
  };
}

// import getConfig from "./config";

// function useCurrentUser() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     async function loadUser() {
//       try {
//         const { adobeIoEndpoint } = getConfig();
//         const baseUrl = adobeIoEndpoint || '';
//         const employee = await syncAndGetEmployee(baseUrl);
//         setUser(employee);
//       } catch (e) {
//         console.error("User load failed", e);
//       }
//     }

//     loadUser();
//   }, []);

//   return user;
// }
