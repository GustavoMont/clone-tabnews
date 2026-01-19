function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = resource.id === user.id || can(user, "update:user:others")
  }

  return authorized;
}

const authorization = { can };

export default authorization;
