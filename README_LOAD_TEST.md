# 🚀 Phoenix Lounge Kabwe - 10,000 Concurrent Guests Load Test

This Locust test suite is built to test whether the Phoenix Lounge Kabwe website and backend infrastructure can comfortably handle **10,000 simultaneous guests** placing drink orders, requesting DJ songs, locking VIP booths, and viewing live theme night promotions.

---

## 📋 Prerequisites

Install `locust` (with `geventhttpclient` / `FastHttpUser` support for ultra-low latency & high connection throughput):

```bash
pip install locust
```

---

## ⚡ Quick Start: Interactive Web Dashboard

Start the Locust web UI:

```bash
locust -f locustfile.py --host http://localhost:3000
```

1. Open your browser at **`http://localhost:8089`**
2. Set **Number of users**: `10000`
3. Set **Ramp-up (users started/second)**: `250` (gradually builds up to 10,000 in 40 seconds)
4. Set **Host**: `http://localhost:3000` (or your deployed production URL)
5. Click **Start Swarming** 🚀

---

## 🏭 Headless Benchmark (Automated Report Generation)

To run a 10-minute automated test at 10,000 concurrent guests and export an HTML report:

```bash
locust -f locustfile.py \
  --headless \
  -u 10000 \
  -r 250 \
  --run-time 10m \
  --host http://localhost:3000 \
  --html phoenix_10k_report.html
```

---

## 🔥 Distributed Testing Across Multiple CPU Cores (Recommended for 10,000+ Users)

When testing 10,000+ users on a single machine or server cluster, run Locust in **Master / Worker mode** across CPU cores to avoid socket bottlenecks:

### 1. Start the Master Node:
```bash
locust -f locustfile.py --master --host http://localhost:3000
```

### 2. Spawn 4 to 8 Workers (in separate terminals or background processes):
```bash
locust -f locustfile.py --worker &
locust -f locustfile.py --worker &
locust -f locustfile.py --worker &
locust -f locustfile.py --worker &
```

---

## 📊 Key Metrics Monitored in this Test Suite

| Test Group | Action | Realistic Flow |
| :--- | :--- | :--- |
| **Homepage & Assets** | Page Load (`/`) | Simulates mobile guests opening the web app |
| **Menu & Catalog** | Menu Browsing (`/?section=menu-section`) | Viewing beers, cognac, champagne & charcoal braii |
| **Orders & Checkout** | Ordering Drinks (`/api/orders`) | Mobile money (Airtel/MTN/Zamtel) & cash order dispatches |
| **Live DJ Console** | Song Requests (`/api/dj/requests`) | Table patrons requesting Amapiano, Afrobeats & Gengetone |
| **Birthday & VIP** | Fanfare & Holds (`/api/vip/lock`) | VIP sparklers and 20-minute table locks |
| **Staff & Audits** | Gross Revenue (`/api/staff/audit`) | Management checking live financials & order dispatches |
