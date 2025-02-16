let user = $state(null);
let loading = $state(true);

export function getUser() {
  return user;
}

export function getLoading() {
  return loading;
}

export function setUser(newUser) {
  user = newUser;
}

export function setLoading(isLoading) {
  loading = isLoading;
}