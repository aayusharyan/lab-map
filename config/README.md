# Lab Map Configuration Files

This directory contains the default JSON configurations for each Lab Map visualization page. These files are committed to git and baked into the Docker image so the UI works out of the box.

**To customize:** Edit these files directly (development) or mount a local directory over `/app/config` (Docker):

```bash
docker run -d -p 8080:80 -v /path/to/your/config:/app/config ghcr.io/aayusharyan/lab-map:latest
```

---

## Table of Contents

- [Overview](#overview)
- [File Summary](#file-summary)
- [1. physical.json - Physical Network Topology](#1-physicaljson---physical-network-topology)
- [2. traffic.json - Service Flows & Dependencies](#2-trafficjson---service-flows--dependencies)
- [3. vlan.json - VLAN Segmentation](#3-vlanjson---vlan-segmentation)
- [4. settings.json - Application Settings](#4-settingsjson---application-settings)
- [Node Types Reference](#node-types-reference)
- [Common Patterns](#common-patterns)

---

## Overview

Lab Map uses five JSON configuration files to visualize network infrastructure:

| File            | Purpose                       | Visualization                   |
| --------------- | ----------------------------- | ------------------------------- |
| `physical.json` | Hardware, cables, ports       | Network graph with device icons |
| `traffic.json`  | Services, traffic flows       | Filterable flow diagram         |
| `vlan.json`     | VLAN segments, firewall rules | Clustered network diagram       |
| `settings.json` | App preferences               | N/A (runtime config)            |

All data files are validated against JSON schemas in `schema/` using `ajv`.

---

## File Summary

```
config/
├── physical.json   # Physical network topology (devices, cables, ports)
├── traffic.json    # Service flows (Docker, Traefik, DNS, monitoring)
├── vlan.json       # VLAN segmentation (subnets, firewall rules)
└── settings.json   # Application settings (theme, zoom, sidebar)
```

---

## 1. physical.json - Physical Network Topology

**Schema:** `schema/physical.schema.json`

Defines the physical network infrastructure: devices (nodes), cable connections (edges), hardware specifications, and switch port mappings.

### Root Structure

```json
{
  "$comment": "Optional: description of this file",
  "nodes": [...],
  "edges": [...]
}
```

| Key        | Type   | Required | Description                                                 |
| ---------- | ------ | -------- | ----------------------------------------------------------- |
| `$comment` | string | No       | File description (ignored by app, useful for documentation) |
| `nodes`    | array  | **Yes**  | List of physical devices (minimum 1)                        |
| `edges`    | array  | **Yes**  | List of cable connections (minimum 1)                       |

---

### nodes[] - Physical Devices

Each node represents a physical device in your network.

```json
{
  "id": "router1",
  "label": "router-1-1",
  "type": "router",
  "meta": { ... }
}
```

| Key     | Type   | Required | Description                                                                                                                                         |
| ------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`    | string | **Yes**  | Unique identifier (used in edge `from`/`to` references). Use lowercase, alphanumeric with hyphens. Examples: `router1`, `sw1`, `ctrl1`, `c1`, `k41` |
| `label` | string | **Yes**  | Display label shown on the graph. Can include hostname or descriptive text. Examples: `router-1-1`, `switch-1-1`, `compute-1-1`                     |
| `type`  | string | **Yes**  | Node type determining the icon and visual style. See [Node Types](#physical-node-types)                                                             |
| `meta`  | object | **Yes**  | Metadata object containing device details                                                                                                           |

#### Physical Node Types

| Type         | Description             | Use For                               |
| ------------ | ----------------------- | ------------------------------------- |
| `internet`   | WAN/ISP cloud icon      | ISP uplink, public internet           |
| `router`     | Router/firewall icon    | Gateways, firewalls, OPNsense/pfSense |
| `switch`     | Network switch icon     | Managed/unmanaged switches            |
| `ap`         | Access point icon       | WiFi access points                    |
| `control`    | Server icon (blue tint) | Control-plane servers, infrastructure |
| `compute`    | Server icon (neutral)   | General compute workloads             |
| `k3s-master` | Kubernetes icon         | K3s/K8s control-plane nodes           |
| `k3s-worker` | Kubernetes icon         | K3s/K8s worker nodes                  |

---

### meta{} - Node Metadata

Detailed information about each device.

```json
{
  "hostname": "router-1-1",
  "role": "Gateway router / firewall",
  "ip": "192.168.1.1",
  "mac": "48-0f-cf-47-68-df",
  "note": "WAN gateway; VLAN trunk to switch-1-1",
  "hardware": { ... }
}
```

| Key        | Type   | Required | Description                                                                                |
| ---------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `hostname` | string | **Yes**  | Device hostname (e.g., `core-router`, `nas-01`, `k3s-master`)                              |
| `role`     | string | **Yes**  | Brief role description (e.g., `Gateway router / firewall`, `Primary NAS`)                  |
| `ip`       | string | No       | Primary management IP address. Can be `dynamic (ISP-assigned)` for WAN                     |
| `mac`      | string | No       | Primary MAC address. Format: `xx-xx-xx-xx-xx-xx` (lowercase hex with hyphens) or `unknown` |
| `note`     | string | No       | Additional notes about the device. Supports multi-line with `\n`                           |
| `hardware` | object | No       | Detailed hardware specifications (see below)                                               |

---

### hardware{} - Hardware Specifications

Detailed hardware specs for servers and compute nodes.

```json
{
  "model": "Dell OptiPlex 7040",
  "cpu": "Intel Core i7-8700 @ 3.20 GHz",
  "cores": "6C / 12T",
  "ram": "16 GB (2×8 GB) DDR4 2400",
  "wol": true,
  "ipmi": false,
  "nics": [...],
  "storage": [...]
}
```

| Key       | Type    | Required | Description                                                           |
| --------- | ------- | -------- | --------------------------------------------------------------------- |
| `model`   | string  | No       | Device model name (e.g., `Dell PowerEdge R720`, `Raspberry Pi 4B`)    |
| `cpu`     | string  | No       | CPU model with clock speed (e.g., `Intel Xeon E5-2680 v2 @ 2.80 GHz`) |
| `cores`   | string  | No       | Core/thread count (e.g., `8C/16T`, `4C/4T`, `6C / 12T`)               |
| `ram`     | string  | No       | Total RAM with details (e.g., `64 GB (4×16 GB) DDR4 3200`)            |
| `wol`     | boolean | No       | Wake-on-LAN capability (`true` if supported and enabled)              |
| `ipmi`    | boolean | No       | Out-of-band management (iLO, iDRAC, IPMI) availability                |
| `nics`    | array   | No       | List of network interface cards (see below)                           |
| `storage` | array   | No       | List of storage devices (see below)                                   |

---

### nics[] - Network Interface Cards

```json
{
  "name": "eth0",
  "speed": "1 Gbps",
  "mac": "48-0f-cf-47-68-df",
  "connected_to": "switch-1-1 port 3",
  "note": "Primary LAN interface"
}
```

| Key            | Type   | Required | Description                                                                      |
| -------------- | ------ | -------- | -------------------------------------------------------------------------------- |
| `name`         | string | **Yes**  | Interface name as shown in OS (e.g., `eth0`, `enp3s0`, `lan1`, `WAN`)            |
| `speed`        | string | **Yes**  | Link speed capability (e.g., `1 Gbps`, `2.5 Gbps`, `10 Gbps`, `100 Mbps`)        |
| `mac`          | string | No       | MAC address (format: `xx-xx-xx-xx-xx-xx` lowercase or `unknown`)                 |
| `connected_to` | string | No       | What device/port this connects to (e.g., `switch-1-1 port 5`, `router-1-1 LAN1`) |
| `note`         | string | No       | Notes about this interface (e.g., `Trunk uplink`, `VLAN 10 access`)              |

---

### storage[] - Storage Devices

```json
{
  "dev": "sda",
  "size": "465.8 GB",
  "type": "SSD",
  "model": "Samsung 870 EVO",
  "seqRead": "550 MB/s"
}
```

| Key       | Type   | Required | Description                                                                           |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| `dev`     | string | **Yes**  | Device path in OS (e.g., `/dev/sda`, `sda`, `nvme0n1`, `disk0`)                       |
| `size`    | string | **Yes**  | Storage capacity (e.g., `500 GB`, `2 TB`, `931.5 GB`)                                 |
| `type`    | string | **Yes**  | Storage technology. **Valid values:** `SSD`, `HDD`, `NVMe`, `NVMe SSD`, `USB`, `eMMC` |
| `model`   | string | No       | Drive model name/number (e.g., `WDC WD5000LPCX`, `Samsung 980 Pro`)                   |
| `seqRead` | string | No       | Sequential read speed (e.g., `550 MB/s`, `3500 MB/s`, `200 MB/s`)                     |

---

### edges[] - Physical Cable Connections

Each edge represents a physical cable between two devices.

```json
{
  "id": "ph_router_sw1",
  "from": "router1",
  "to": "sw1",
  "type": "trunk",
  "label": "trunk\nall VLANs",
  "fromPort": "LAN1",
  "toPort": "port 1",
  "speed": "1 Gbps",
  "vlans": "1,10,20,40,60,70",
  "cable": "Cat6",
  "cableColor": "blue",
  "category": "Uplink trunk"
}
```

| Key          | Type   | Required | Description                                                                       |
| ------------ | ------ | -------- | --------------------------------------------------------------------------------- |
| `id`         | string | **Yes**  | Unique identifier for this edge. Convention: `ph_<from>_<to>`                     |
| `from`       | string | **Yes**  | Source node ID (must match a node's `id`)                                         |
| `to`         | string | **Yes**  | Target node ID (must match a node's `id`)                                         |
| `type`       | string | **Yes**  | Connection type. **Valid values:** `wan`, `trunk`, `access`                       |
| `label`      | string | **Yes**  | Display label (can use `\n` for line breaks). Can be empty string `""`            |
| `fromPort`   | string | No       | Port identifier on source node (e.g., `eth0`, `port 1`, `LAN1`, `sfp+1`)          |
| `toPort`     | string | No       | Port identifier on target node                                                    |
| `speed`      | string | No       | Link speed (e.g., `1 Gbps`, `10 Gbps`, `100 Mbps`)                                |
| `vlans`      | string | No       | VLAN IDs carried by this link (e.g., `10,20,30`, `1,10,20,40,60,70`, `10`)        |
| `cable`      | string | No       | Cable type (e.g., `Cat5e`, `Cat6`, `Cat6a`, `OM4 fiber`, `DAC`)                   |
| `cableColor` | string | No       | Physical cable color for identification (e.g., `blue`, `yellow`, `grey`, `white`) |
| `category`   | string | No       | Cable category/description (e.g., `Uplink trunk`, `Access port`, `WAN uplink`)    |
| `arrows`     | string | No       | Arrow direction for vis-network (e.g., `to`, `from`, `to;from`)                   |

#### Edge Types

| Type     | Description                          | Example                      |
| -------- | ------------------------------------ | ---------------------------- |
| `wan`    | WAN/ISP uplink                       | Internet → Router            |
| `trunk`  | 802.1Q trunk carrying multiple VLANs | Router → Switch, Switch → AP |
| `access` | Single VLAN access port              | Switch → Server              |

---

## 2. traffic.json - Service Flows & Dependencies

**Schema:** `schema/traffic.schema.json`

Defines service-level traffic flows: Docker containers, reverse proxy routes, DNS resolution, and inter-service dependencies. The UI provides filterable "flows" to visualize specific traffic paths.

### Root Structure

```json
{
  "$comment": "Optional description",
  "flows": [...],
  "nodes": [...],
  "edges": [...]
}
```

| Key        | Type   | Required | Description                                                  |
| ---------- | ------ | -------- | ------------------------------------------------------------ |
| `$comment` | string | No       | File description                                             |
| `flows`    | array  | **Yes**  | List of traffic flow categories for UI filtering (minimum 1) |
| `nodes`    | array  | **Yes**  | List of services/infrastructure nodes (minimum 1)            |
| `edges`    | array  | **Yes**  | List of traffic connections (minimum 1)                      |

---

### flows[] - Traffic Flow Categories

Flows are filterable categories in the UI. Each flow groups related nodes and edges.

```json
{
  "id": "flow_inbound_https",
  "label": "Inbound HTTPS"
}
```

| Key     | Type   | Required | Description                                                                                                                             |
| ------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`    | string | **Yes**  | Unique flow identifier. **Must match pattern:** `flow_[a-z0-9_]+`. Examples: `flow_web`, `flow_dns`, `flow_monitoring`, `flow_pxe_boot` |
| `label` | string | **Yes**  | Human-readable label shown in flow bar UI. Examples: `Inbound HTTPS`, `DNS Resolution`, `Monitoring push`                               |

---

### nodes[] - Service/Infrastructure Nodes

Each node represents a service, container, or infrastructure component.

```json
{
  "id": "ctrl1",
  "label": "control-1-1",
  "type": "control",
  "flows": ["flow_inbound_https", "flow_ansible_pull", "flow_pxe_boot"],
  "meta": { ... }
}
```

| Key     | Type   | Required | Description                                                                                     |
| ------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| `id`    | string | **Yes**  | Unique identifier (used in edge references)                                                     |
| `label` | string | **Yes**  | Display label (can include `\n` for line breaks)                                                |
| `type`  | string | **Yes**  | Node type. See [Traffic Node Types](#traffic-node-types)                                        |
| `flows` | array  | **Yes**  | Array of flow IDs this node participates in. Node is visible when any of its flows are selected |
| `meta`  | object | **Yes**  | Node metadata with service configuration                                                        |

#### Traffic Node Types

| Type         | Description      | Use For                              |
| ------------ | ---------------- | ------------------------------------ |
| `internet`   | WAN/ISP cloud    | External internet                    |
| `cloudflare` | Cloudflare icon  | CDN, DNS proxy                       |
| `publicip`   | Public IP icon   | ISP-assigned WAN IP                  |
| `router`     | Router icon      | Gateway, firewall                    |
| `vip`        | Virtual IP icon  | Macvlan VIPs (Traefik, CoreDNS, PXE) |
| `control`    | Server (blue)    | Control-plane servers                |
| `compute`    | Server (neutral) | General compute                      |
| `k3s-master` | K8s master icon  | K3s control-plane                    |
| `k3s-worker` | K8s worker icon  | K3s workers                          |

---

### meta{} - Traffic Node Metadata

```json
{
  "hostname": "control-1-1",
  "role": "Primary control server",
  "ip": "192.168.10.2",
  "hostedOn": "proxmox-01",
  "note": "Runs PXE stack, Gitea, Harbor.",
  "serviceConfig": { ... }
}
```

| Key             | Type   | Required | Description                                                         |
| --------------- | ------ | -------- | ------------------------------------------------------------------- |
| `hostname`      | string | **Yes**  | Node hostname or identifier                                         |
| `role`          | string | **Yes**  | Brief role description                                              |
| `ip`            | string | No       | IP address                                                          |
| `hostedOn`      | string | No       | Physical host if VM/container (e.g., `proxmox-01`, `k3s-worker-01`) |
| `note`          | string | No       | Additional notes                                                    |
| `serviceConfig` | object | No       | Service configuration (see below)                                   |

---

### serviceConfig{} - Service Configuration

Contains Docker services, reverse proxy routes, and firewall rules.

```json
{
  "services": [...],
  "routes": [...],
  "interVlanRules": [...]
}
```

| Key              | Type  | Required | Description                                                      |
| ---------------- | ----- | -------- | ---------------------------------------------------------------- |
| `services`       | array | No       | List of Docker services (can be strings or full service objects) |
| `routes`         | array | No       | List of reverse proxy routes (for VIP/Traefik nodes)             |
| `interVlanRules` | array | No       | List of inter-VLAN firewall rules (for router nodes)             |

---

### services[] - Docker Services

Can be simple strings or full service objects.

**Simple format:**

```json
"services": ["k3s-agent", "node-exporter"]
```

**Full format:**

```json
{
  "name": "ollama",
  "image": "ollama/ollama:latest",
  "port": "20000:11434",
  "vip": null,
  "env": ["OLLAMA_MAX_LOADED_MODELS=1", "OLLAMA_NUM_PARALLEL=1"],
  "volumes": ["/opt/stacks/ollama/models:/root/.ollama"],
  "note": "CPU-only inference server"
}
```

| Key       | Type         | Required | Description                                                             |
| --------- | ------------ | -------- | ----------------------------------------------------------------------- |
| `name`    | string       | **Yes**  | Service/container name                                                  |
| `image`   | string       | No       | Docker image reference (e.g., `traefik:v3.0`, `grafana/grafana:latest`) |
| `port`    | string       | No       | Port mapping in `host:container` format (e.g., `80:80`, `20000:11434`)  |
| `vip`     | string\|null | No       | Virtual IP if using macvlan (e.g., `192.168.10.153`), or `null`         |
| `env`     | array        | No       | Environment variables in `KEY=value` format                             |
| `volumes` | array        | No       | Volume mounts in `host:container` format                                |
| `note`    | string       | No       | Additional notes                                                        |

---

### routes[] - Reverse Proxy Routes

For Traefik/nginx VIP nodes.

```json
{
  "domain": "grafana.yush.dev",
  "backend": "compute-1-5:20200"
}
```

| Key       | Type   | Required | Description                                                                |
| --------- | ------ | -------- | -------------------------------------------------------------------------- |
| `domain`  | string | **Yes**  | Domain for this route (e.g., `grafana.example.com`, `*.local.example.com`) |
| `backend` | string | **Yes**  | Backend service (e.g., `http://grafana:3000`, `compute-1-5:20200`)         |

---

### edges[] - Traffic Flow Connections

```json
{
  "id": "tr_c1",
  "from": "vip_traefik",
  "to": "c1",
  "flows": ["flow_inbound_https"],
  "type": "proxy",
  "label": "ollama.yush.dev",
  "arrows": "to",
  "tls": true,
  "tlsTermination": "Traefik (ACME)",
  "port": 20000,
  "protocol": "TCP",
  "domains": ["ollama.yush.dev"],
  "note": "Ollama API endpoint"
}
```

| Key              | Type            | Required | Description                                                                 |
| ---------------- | --------------- | -------- | --------------------------------------------------------------------------- |
| `id`             | string          | **Yes**  | Unique edge identifier                                                      |
| `from`           | string          | **Yes**  | Source node ID                                                              |
| `to`             | string          | **Yes**  | Target node ID                                                              |
| `flows`          | array           | **Yes**  | Flow IDs this edge participates in                                          |
| `type`           | string          | **Yes**  | Edge type. See [Traffic Edge Types](#traffic-edge-types)                    |
| `arrows`         | string          | **Yes**  | Arrow direction (`to`, `from`, `to;from`)                                   |
| `label`          | string          | No       | Display label                                                               |
| `tls`            | boolean         | No       | Whether connection uses TLS                                                 |
| `tlsTermination` | string          | No       | Where TLS terminates (e.g., `Cloudflare edge`, `Traefik (ACME)`, `backend`) |
| `port`           | string\|integer | No       | Port number(s) (e.g., `443`, `"80, 443"`, `20000`)                          |
| `protocol`       | string          | No       | Protocol (e.g., `TCP`, `UDP`, `UDP + TCP`, `HTTPS`, `DNS`)                  |
| `domains`        | array           | No       | List of domains carried by this connection                                  |
| `note`           | string          | No       | Additional notes                                                            |

#### Traffic Edge Types

| Type         | Description              | Example                          |
| ------------ | ------------------------ | -------------------------------- |
| `wan`        | WAN/ISP connection       | Internet → Router                |
| `cdn`        | CDN proxy connection     | Cloudflare → Public IP           |
| `proxy`      | Reverse proxy to backend | Traefik → Compute node           |
| `hosts`      | DNS resolution           | Any node → CoreDNS               |
| `forward`    | Port forward/NAT         | Public IP → Traefik VIP          |
| `dependency` | Service dependency       | Compute → Gitea for ansible-pull |
| `internal`   | Internal traffic         | Pod scheduling, metrics push     |

---

## 3. vlan.json - VLAN Segmentation

**Schema:** `schema/vlan.schema.json`

Defines VLAN network segmentation: VLAN clusters with subnets, member node assignments, and inter-VLAN firewall rules. VLANs are displayed as collapsible clusters.

### Root Structure

```json
{
  "$comment": "Optional description",
  "nodes": [...],
  "edges": [...]
}
```

| Key        | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `$comment` | string | No       | File description                                               |
| `nodes`    | array  | **Yes**  | List of VLAN segments and member nodes (minimum 1)             |
| `edges`    | array  | **Yes**  | List of VLAN membership and inter-VLAN connections (minimum 1) |

---

### nodes[] - VLAN Page Nodes

Nodes can be either **VLAN segments** (clusters) or **machine nodes** (members).

#### VLAN Segment Node

```json
{
  "id": "vlan20",
  "label": "VLAN 20\nCompute",
  "type": "vlan",
  "meta": {
    "vlanId": 20,
    "name": "Compute",
    "subnet": "192.168.20.0/24",
    "gateway": "192.168.20.1",
    "dhcpRange": "192.168.20.100 – 192.168.20.199",
    "members": ["compute-1-1", "compute-1-2"],
    "vips": ["asterisk-pbx @ 192.168.20.151"],
    "interVlanRules": [
      "→ VLAN 10 (Infra): DNS, Git, Harbor, PXE",
      "← VLAN 10 (Infra): Traefik forwards requests"
    ],
    "captivePortal": false,
    "note": "Stateful compute workloads"
  }
}
```

| Key     | Type   | Required | Description                                  |
| ------- | ------ | -------- | -------------------------------------------- |
| `id`    | string | **Yes**  | Unique identifier (e.g., `vlan10`, `vlan20`) |
| `label` | string | **Yes**  | Display label (can use `\n` for line breaks) |
| `type`  | string | **Yes**  | Must be `vlan` for VLAN segment nodes        |
| `meta`  | object | **Yes**  | VLAN metadata (see below)                    |

---

### meta{} - VLAN Segment Metadata

```json
{
  "vlanId": 20,
  "name": "Compute",
  "subnet": "192.168.20.0/24",
  "gateway": "192.168.20.1",
  "dhcpRange": "192.168.20.100 – 192.168.20.199",
  "members": ["compute-1-1", "compute-1-2", "compute-1-3"],
  "vips": ["asterisk-pbx @ 192.168.20.151"],
  "interVlanRules": [...],
  "captivePortal": false,
  "note": "Compute VLAN for Docker workloads"
}
```

| Key              | Type    | Required | Description                                                                    |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------------ |
| `vlanId`         | integer | **Yes**  | 802.1Q VLAN ID (1-4094). Common ranges: 1-999 user VLANs, 1000+ infrastructure |
| `name`           | string  | **Yes**  | VLAN name (e.g., `Management`, `Servers`, `IoT`, `Guest`)                      |
| `subnet`         | string  | **Yes**  | IPv4 subnet in CIDR notation (e.g., `192.168.20.0/24`, `10.0.10.0/24`)         |
| `gateway`        | string  | No       | Default gateway IP (typically `.1` of subnet)                                  |
| `dhcpRange`      | string  | No       | DHCP range if enabled (e.g., `192.168.20.100 – 192.168.20.199`)                |
| `members`        | array   | No       | Array of hostnames in this VLAN                                                |
| `vips`           | array   | No       | Array of virtual IPs (e.g., `traefik @ 192.168.10.153`)                        |
| `interVlanRules` | array   | No       | Array of firewall rules (e.g., `→ VLAN 10: DNS only`)                          |
| `captivePortal`  | boolean | No       | Whether captive portal is enabled (for Guest networks)                         |
| `note`           | string  | No       | Additional notes                                                               |

---

#### Machine Node (VLAN Member)

```json
{
  "id": "c1",
  "label": "compute-1-1",
  "type": "compute",
  "meta": {
    "hostname": "compute-1-1",
    "role": "Compute — Ollama LLM inference",
    "ip": "192.168.20.2",
    "vlan": [20],
    "hostedOn": "proxmox-01",
    "note": "CPU-only Ollama inference."
  }
}
```

| Key     | Type   | Required | Description                                        |
| ------- | ------ | -------- | -------------------------------------------------- |
| `id`    | string | **Yes**  | Unique identifier                                  |
| `label` | string | **Yes**  | Display label                                      |
| `type`  | string | **Yes**  | Node type. See [VLAN Node Types](#vlan-node-types) |
| `meta`  | object | **Yes**  | Machine metadata (see below)                       |

#### VLAN Node Types

| Type         | Description            |
| ------------ | ---------------------- |
| `internet`   | WAN/ISP                |
| `router`     | Gateway/firewall       |
| `switch`     | Network switch         |
| `ap`         | Access point           |
| `vlan`       | VLAN segment (cluster) |
| `control`    | Control-plane server   |
| `compute`    | Compute node           |
| `k3s-master` | K3s master             |
| `k3s-worker` | K3s worker             |
| `vip`        | Virtual IP             |

---

### meta{} - Machine Node Metadata

```json
{
  "hostname": "compute-1-1",
  "role": "Compute — Ollama LLM inference",
  "ip": "192.168.20.2",
  "vlan": [20],
  "hostedOn": "proxmox-01",
  "note": "CPU-only Ollama inference."
}
```

| Key        | Type   | Required | Description                                                      |
| ---------- | ------ | -------- | ---------------------------------------------------------------- |
| `hostname` | string | **Yes**  | Device hostname                                                  |
| `role`     | string | **Yes**  | Brief role description                                           |
| `ip`       | string | No       | Primary IP address                                               |
| `vlan`     | array  | No       | Array of VLAN IDs this node belongs to (for multi-homed devices) |
| `hostedOn` | string | No       | Physical host if VM/container                                    |
| `note`     | string | No       | Additional notes                                                 |

---

### edges[] - VLAN Connections

#### Membership Edge (Node → VLAN)

```json
{
  "id": "vl_vlan20_c1",
  "from": "vlan20",
  "to": "c1",
  "type": "member",
  "label": "",
  "arrows": ""
}
```

#### Inter-VLAN Edge (VLAN → VLAN)

```json
{
  "id": "iv_vlan10_vlan20",
  "from": "vlan10",
  "to": "vlan20",
  "type": "intervlan",
  "label": "Traefik → backends\nTCP 20000-20299",
  "arrows": "to",
  "meta": {
    "allowed": [
      "TCP 20000 → c1 (Ollama)",
      "TCP 20000/20100 → c2 (Jenkins/WebUI)"
    ],
    "denied": "all other ports"
  }
}
```

| Key      | Type   | Required | Description                                                                                       |
| -------- | ------ | -------- | ------------------------------------------------------------------------------------------------- |
| `id`     | string | **Yes**  | Unique identifier. Convention: `vl_<vlan>_<node>` for membership, `iv_<from>_<to>` for inter-VLAN |
| `from`   | string | **Yes**  | Source node ID                                                                                    |
| `to`     | string | **Yes**  | Target node ID                                                                                    |
| `type`   | string | **Yes**  | Edge type: `wan`, `member`, `intervlan`                                                           |
| `label`  | string | **Yes**  | Display label (can be empty string `""`)                                                          |
| `arrows` | string | No       | Arrow direction (`to`, `from`, `to;from`, or empty `""`)                                          |
| `note`   | string | No       | Additional notes                                                                                  |
| `meta`   | object | No       | Inter-VLAN rule details (see below)                                                               |

#### Edge meta{} for Inter-VLAN Rules

```json
{
  "allowed": [
    "UDP 53 → 192.168.10.152 (DNS)",
    "TCP 20100/20101 → 192.168.10.2 (Gitea)"
  ],
  "denied": "all other ports"
}
```

| Key       | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `allowed` | array  | No       | Array of allowed services/ports |
| `denied`  | string | No       | Default deny description        |

---

## 4. settings.json - Application Settings

**Schema:** `schema/settings.schema.json`

Application preferences loaded on startup. Can be modified in the settings panel at runtime.

```json
{
  "$comment": "Optional description",
  "defaultPage": "physical",
  "theme": "light",
  "fontSize": 15,
  "scrollToZoom": true,
  "sidebarWidth": 320,
  "showLegend": true,
  "showEdgeLabels": true,
  "physics": {
    "enabled": true
  }
}
```

| Key              | Type    | Required | Default             | Description                                                               |
| ---------------- | ------- | -------- | ------------------- | ------------------------------------------------------------------------- |
| `$comment`       | string  | No       | -                   | File description                                                          |
| `defaultPage`    | string  | No       | `"physical"`        | Initial page on app load. **Valid values:** `physical`, `traffic`, `vlan` |
| `theme`          | string  | No       | `"light"`           | Color theme. **Valid values:** `light`, `dark`                            |
| `fontSize`       | integer | No       | `15`                | Base font size in pixels                                                  |
| `scrollToZoom`   | boolean | No       | `true`              | Enable scroll wheel to zoom on graph views                                |
| `sidebarWidth`   | integer | No       | `320`               | Sidebar width in pixels                                                   |
| `showLegend`     | boolean | No       | `true`              | Show legend panel on graph views                                          |
| `showEdgeLabels` | boolean | No       | `true`              | Show labels on edges in graph views                                       |
| `physics`        | object  | No       | `{"enabled": true}` | Physics simulation settings                                               |

### physics{} - Physics Settings

```json
{
  "enabled": true
}
```

| Key       | Type    | Required | Default | Description                                         |
| --------- | ------- | -------- | ------- | --------------------------------------------------- |
| `enabled` | boolean | No       | `true`  | Enable vis-network physics simulation (auto-layout) |

---

## Node Types Reference

### All Node Types by File

| File              | Valid `type` Values                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **physical.json** | `internet`, `router`, `switch`, `ap`, `control`, `compute`, `k3s-master`, `k3s-worker`                  |
| **traffic.json**  | `internet`, `cloudflare`, `publicip`, `router`, `vip`, `control`, `compute`, `k3s-master`, `k3s-worker` |
| **vlan.json**     | `internet`, `router`, `switch`, `ap`, `vlan`, `control`, `compute`, `k3s-master`, `k3s-worker`, `vip`   |

---

## Common Patterns

### ID Naming Conventions

| Pattern            | Use               | Examples                                            |
| ------------------ | ----------------- | --------------------------------------------------- |
| `<type><number>`   | Simple sequential | `router1`, `sw1`, `c1`, `ctrl1`                     |
| `k<number>`        | K3s nodes         | `k41` (master), `k51`-`k54` (workers)               |
| `vlan<id>`         | VLAN segments     | `vlan1`, `vlan10`, `vlan20`                         |
| `vip_<service>`    | Virtual IPs       | `vip_traefik`, `vip_dns`, `vip_pxepilot`            |
| `flow_<name>`      | Traffic flows     | `flow_inbound_https`, `flow_dns`, `flow_monitoring` |
| `ph_<from>_<to>`   | Physical edges    | `ph_router_sw1`, `ph_sw1_c1`                        |
| `vl_<vlan>_<node>` | VLAN membership   | `vl_vlan20_c1`, `vl_vlan10_ctrl1`                   |
| `iv_<from>_<to>`   | Inter-VLAN edges  | `iv_vlan10_vlan20`, `iv_vlan1_vlan10`               |

### Multi-Line Labels

Use `\n` for line breaks in labels:

```json
"label": "VLAN 20\nCompute"
"label": "VIP: Traefik\n192.168.10.153"
"label": "trunk\nall VLANs"
```

### MAC Address Format

Always use lowercase hex with hyphens:

```
48-0f-cf-47-68-df  ✓ Correct
48:0F:CF:47:68:DF  ✗ Wrong (colons, uppercase)
480fcf4768df       ✗ Wrong (no separators)
unknown            ✓ Valid when MAC is not known
```

### Port Notation

```json
"port": "20000:11434"       // Docker host:container mapping
"port": "443"               // Single port
"port": "80, 443"           // Multiple ports
"port": "3389 (RDP)"        // Port with protocol note
"port": 20000               // Integer format also valid
```

### VLAN Notation

```json
"vlans": "10"               // Single VLAN
"vlans": "10,20,30"         // Multiple VLANs
"vlans": "1,10,20,40,60,70" // All trunk VLANs
"vlans": ""                 // No VLANs (WAN link)
```

---

## Quick Start Checklist

When creating new data files:

1. **Start with defaults** - Edit files in `data/` directly or mount your own directory
2. **Validate early** - Run `pnpm watch` to auto-validate on save
3. **Use unique IDs** - Every `id` must be unique within its file
4. **Match references** - Edge `from`/`to` must reference valid node IDs
5. **Check required fields** - Schema validation will fail if required fields are missing
6. **Follow type enums** - Use only valid values for `type` fields

---

## Validation

All data files are validated against JSON schemas using `ajv`:

```bash
# Start dev server with auto-validation
pnpm dev

# Run standalone validation watcher
pnpm watch
```

Schemas are located in `schema/`:

- `physical.schema.json`
- `traffic.schema.json`
- `vlan.schema.json`
- `settings.schema.json`
