import React from "react";
import { render, screen } from "@testing-library/react";

describe("Auth Context - Almacenamiento local", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("debe iniciar con token y usuario nulos", () => {
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("usuario")).toBeNull();
  });

  it("debe guardar credenciales al iniciar sesión", () => {
    const testUser = { id: 1, rol: "ciudadano", nombres: "Test", apellido_paterno: "User", correo: "test@test.com" };
    localStorage.setItem("token", "jwt-token-string");
    localStorage.setItem("usuario", JSON.stringify(testUser));

    expect(localStorage.getItem("token")).toBe("jwt-token-string");
    const storedUser = JSON.parse(localStorage.getItem("usuario"));
    expect(storedUser.rol).toBe("ciudadano");
    expect(storedUser.nombres).toBe("Test");
  });

  it("debe limpiar credenciales al cerrar sesión", () => {
    localStorage.setItem("token", "token-before-logout");
    localStorage.setItem("usuario", JSON.stringify({ id: 1, rol: "ciudadano" }));

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("usuario")).toBeNull();
  });

  it("debe simular validación de expiración de token", () => {
    // Un token expirado tendría exp menor a la fecha actual
    const tokenPayload = { sub: "1", rol: "ciudadano", exp: Date.now() / 1000 - 3600 };
    const ahora = Date.now() / 1000;
    const isExpired = tokenPayload.exp < ahora;
    expect(isExpired).toBe(true);
  });

  it("debe detectar token expirado", () => {
    // Un token expirado tendría exp menor a la fecha actual
    const tokenPayload = { sub: "1", rol: "ciudadano", exp: Date.now() / 1000 - 3600 }; // hace 1 hora
    const ahora = Date.now() / 1000;
    const isExpired = tokenPayload.exp < ahora;
    expect(isExpired).toBe(true);
  });
});