import bcryptjs from "bcryptjs";
import { InternalServerError } from "infra/errors";

async function hash(password) {
  const rounds = getRoundsNumber();
  const pepperedPassword = addPepper(password);
  return await bcryptjs.hash(pepperedPassword, rounds);
}

function isProductionEnviroment() {
  return process.env.NODE_ENV === "production";
}

function getRoundsNumber() {
  return isProductionEnviroment() ? 14 : 1;
}

function addPepper(password) {
  const pepper = isProductionEnviroment() ? process.env.PEPPER : "POTTS";
  if (!pepper) {
    const cause = new Error("Pepper not found");
    throw new InternalServerError({ cause });
  }
  return `${pepper}_${password}_${pepper}`;
}

async function compare(providedPassword, hashedPassword) {
  const pepperedPassword = addPepper(providedPassword);
  return await bcryptjs.compare(pepperedPassword, hashedPassword);
}

const password = {
  compare,
  hash,
};

export default password;
