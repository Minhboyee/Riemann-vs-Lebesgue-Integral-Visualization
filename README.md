
<div align="center">
  <img width="1195" height="630" alt="image" src="https://github.com/user-attachments/assets/db120be2-26c7-44b5-8299-79b9c41b7858" />
   <img width="1194" height="860" alt="image" src="https://github.com/user-attachments/assets/8034260d-1dc3-472e-a77c-5aa14087e51f" />
  <img width="1182" height="654" alt="image" src="https://github.com/user-attachments/assets/75ea832b-7aaf-4328-8fda-e4f724fa5a59" />
</div>

# Integral Explorer – MinhAI2

**Integral Explorer – MinhAI2** is an interactive educational web app designed to build **intuition for Riemann and Lebesgue integration** through visualization, comparison, and real-time interaction.

This project is not focused on numerical accuracy alone.  
Its core goal is to help learners understand **how Riemann and Lebesgue integrals ask fundamentally different questions about the same area**.

> **Same area. Different way of counting.**

---

## 🎯 Purpose of the App

Many students learn that:
- Riemann integrals use rectangles,
- Lebesgue integrals are more general,

but never truly understand **why Lebesgue integration matters**.

This app focuses on the *conceptual shift*:

- **Riemann integration**  
  → counts area by **position** (along the x-axis)

- **Lebesgue integration**  
  → counts area by **value levels** (along the y-axis)

The difference is shown **visually, interactively, and dynamically**, not just symbolically.

---

## 🧠 Core Ideas Illustrated

### Riemann Integration
- Vertical partitions of the domain
- Rectangle-based area approximation
- Coloring progresses **from left to right**
- Sensitive to discontinuities

### Lebesgue Integration
- Horizontal slicing by value levels
- Measure-based accumulation
- Coloring progresses **from bottom to top**
- Robust to changes on measure-zero sets

### Theory-only Integration
- For functions that **cannot be visualized geometrically**
- Demonstrates that Lebesgue integration works by **measure logic, not geometry**
- Example: Dirichlet function

---

## ✨ Key Interactive Features

- **Side-by-side Riemann vs Lebesgue visualization**
- Independent controls for:
  - Riemann partitions (vertical cuts)
  - Lebesgue value levels (horizontal cuts)
- **Coloring sliders**:
  - Riemann: coloring by position (x-axis)
  - Lebesgue: coloring by value (real-time accumulated area)
- Live update of:
  - Partial area accumulation
  - Convergence behavior
- Conceptual comparison table summarizing both approaches

---

## 🧪 Functions Included

- Polynomial functions (e.g. \(x^2\))
- Trigonometric functions
- Linear functions
- Step functions
- Shifted / inverted parabolas
- Dirichlet function (theory-only mode)

---

## 🚀 View the App

You can try the app directly in AI Studio:

👉 **https://ai.studio/apps/drive/1FK4MNIAh5qXsWY6mpjQJQLlsXL4bbF3d**

---

## 🛠️ Run Locally

### Prerequisites
- **Node.js**

### Setup Instructions

1. Install dependencies:
   ```bash
   npm install


2. Create a `.env.local` file and add your API key:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser at:

   ```
   http://localhost:3000
   ```

---

## 📚 Intended Audience

* Undergraduate students studying real analysis
* Self-learners struggling with Lebesgue intuition
* Educators looking for visual teaching tools
* Anyone curious about *why Lebesgue integration is different*

---

## 🧭 Design Philosophy

* **Concept before computation**
* **Visualization as a thinking tool, not decoration**
* **UI interactions carry mathematical meaning**
* Avoid black-box explanations

This app is built to answer one guiding question:

> **“What is Lebesgue really doing differently from Riemann?”**

---

## 📌 Final Note

This project is educational by design.
It does not replace formal proofs, but helps build the **mental model needed to understand them**.

---

**Integral Explorer – MinhAI2**
*Learning integration by changing the question, not the area.*

```
