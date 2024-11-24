export const checkInternetConnection = async () => {

    try {
      const response = await fetch('https://www.facebook.com/', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return response.ok || response.type === 'opaque'; // Consider opaque as success
    } catch {
      return false;
    }
  };
  