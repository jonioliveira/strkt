/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies lead to unpredictable initialization order",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-components-importing-routes",
      severity: "error",
      comment: "UI components must not import from route files — components are leaf nodes",
      from: { path: "^src/components" },
      to: { path: "^src/routes" },
    },
    {
      name: "no-components-importing-server",
      severity: "error",
      comment: "Client components must not directly import server-only modules",
      from: { path: "^src/components" },
      to: { path: "^src/lib/server" },
    },
    {
      name: "no-routes-importing-db-directly",
      severity: "error",
      comment: "Routes must access the database through lib/server functions only",
      from: { path: "^src/routes" },
      to: { path: "^src/db" },
    },
    {
      name: "no-components-importing-db",
      severity: "error",
      comment: "Components must not access the database directly",
      from: { path: "^src/components" },
      to: { path: "^src/db" },
    },
    {
      name: "no-client-auth-importing-server-auth",
      severity: "error",
      comment: "auth-client.ts must not import server auth — would leak server secrets to the client bundle",
      from: { path: "^src/lib/auth-client" },
      to: { path: "^src/lib/auth\\.ts$" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
}
