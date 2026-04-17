# schema

JSON Schema definitions for all topology data files.

Each schema is a JSON Schema Draft-07 document validated with [ajv](https://github.com/ajv-validator/ajv).
The watcher (`watcher.js`) validates data files against their schemas and additionally
verifies cross-file invariants that JSON Schema alone cannot express (dangling edge
references, undeclared flow IDs).

| File / directory       | Description                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `physical.schema.json` | Validates `data/physical.json` — LAN cable topology, hardware specs, NIC/port details.          |
| `traffic.schema.json`  | Validates `data/traffic.json` — service flows, Traefik routes, DNS, PXE, monitoring.            |
| `vlan.schema.json`     | Validates `data/vlan.json` — VLAN cluster nodes, member assignments, inter-VLAN firewall rules. |
