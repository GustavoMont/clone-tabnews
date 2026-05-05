import { InternalServerError } from "infra/errors";
import authorization from "models/authorization.js";

describe("models/authorization", () => {
  describe(".can()", () => {
    test("with valid `user` and known `feature`", () => {
      const user = {
        features: ["read:user"],
      };

      expect(authorization.can(user, "read:user")).toBe(true);
    });
    test("without `user`", () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });
    test("with invalid `user`", () => {
      expect(() => authorization.can({})).toThrow(InternalServerError);
    });
    test("without `feature`", () => {
      const user = {
        features: ["read:user"],
      };
      expect(() => authorization.can(user)).toThrow(InternalServerError);
    });
    test("with unknown `feature`", () => {
      const user = {
        features: ["read:user"],
      };
      expect(() => authorization.can(user, "unknown:feature")).toThrow(
        InternalServerError,
      );
    });
  });
  describe(".filterOutput()", () => {
    test("with valid `user`, known `feature` and resource", () => {
      const user = {
        features: ["read:user"],
      };
      const resource = {
        id: 1,
        username: "username",
        email: "email@email",
        password: "password",
        features: ["read:user"],
        created_at: "2026-05-05T22:53:00.598Z",
        updated_at: "2026-05-05T22:53:00.598Z",
      };

      expect(authorization.filterOutput(user, "read:user", resource)).toEqual({
        id: 1,
        username: "username",
        features: ["read:user"],
        created_at: "2026-05-05T22:53:00.598Z",
        updated_at: "2026-05-05T22:53:00.598Z",
      });
    });
    test("with valid `user`, known `feature` but no resource", () => {
      const user = {
        features: ["read:user"],
      };

      expect(() => authorization.filterOutput(user, "read:user")).toThrow(
        InternalServerError,
      );
    });
    test("without `user`", () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });
    test("with invalid `user`", () => {
      expect(() => authorization.filterOutput({})).toThrow(InternalServerError);
    });
    test("without `feature`", () => {
      const user = {
        features: ["read:user"],
      };
      expect(() => authorization.filterOutput(user)).toThrow(
        InternalServerError,
      );
    });
    test("with unknown `feature`", () => {
      const user = {
        features: ["read:user"],
      };
      expect(() => authorization.filterOutput(user, "unknown:feature")).toThrow(
        InternalServerError,
      );
    });
  });
});
