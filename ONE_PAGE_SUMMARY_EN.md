---
Title: Scientific Abstract - Linka Project
Conference: Palestine Cybersecurity & AI Conference 2026
---

# Linka: A Secure National Ecosystem for Volunteering and Interactive Placement

**Authors:** Qais Amro, Hanaa Maswadi, Bashar Wazwaz  
**Supervisor:** Dr. Hani Salah  
**Track:** Artificial Intelligence and the Building of the Palestinian State  
**Keywords:** Cybersecurity, Digital Ecosystems, Artificial Intelligence, Immutable Records, Skill Verification, Palestine.

---

### Abstract

**Background & Problem Statement:** The contemporary volunteering and human resources ecosystem for young talents in Palestine lacks centralized, secure, and verifiable tracking architectures. Consequently, significant practical training and community efforts dissipate without tangible, quantifiable recognition. Furthermore, reliance on unencrypted informal platforms for recruitment exposes sensitive user data to critical privacy and cybersecurity threats, precluding the possibility of sovereign digital sustainability.

**Objectives:** This project introduces "Linka," a highly secure, technologically advanced digital ecosystem designed to bridge the gap between youth volunteering and local job market demands. The primary objective is to implement a sovereign tracking engine that translates geographical and event-based participations into immutable "Digital CVs," enabling recruiting enterprises to systematically evaluate authentic capabilities rather than traditional paper-based resumes.

**Methodology & System Architecture:** Linka is engineered upon a strictly decoupled Client-Server architecture tailored for high availability and zero-trust security. The client-side interface operates as a highly responsive Single Page Application (SPA) driven by React.js and advanced state management logic, minimizing exposure anomalies. The backend relies on an asynchronous Node.js and Express.js environment, seamlessly interacting with an ACID-compliant PostgreSQL relational database. Rigorous cybersecurity protocols dictate the system’s architecture: JSON Web Tokens (JWT) distributed strictly via HttpOnly Cookies eliminate XSS and CSRF vectors, while robust Parameterized Queries guarantee immunity against SQL Injection. Furthermore, all data in transit and rest relies on secure tunneling and Bcrypt hashing mechanisms, shielded by Middleware Access Control and strict API Rate Limiting. 

**AI Integration:** To transcend conventional recruitment portals, Linka integrates Artificial Intelligence directly into its core engine. Predictive analytical matchmaking algorithms proactively align youths’ historically verified skills with optimal institutional opportunities, while simultaneous AI-driven security analytics continuously monitor the environment for anomalous behaviors to autonomously identify and mitigate emergent threat patterns.

**Status & Conclusion:** The foundational development of Linka has concluded, with the system currently deployed and operating on live production servers. The project has transitioned into an operational phase strictly centered around continuous AI algorithm reinforcement derived from live data, alongside rigorous Advanced Penetration Testing and Stress/Load Analysis. By proposing an operationally verified, secure, and scalable national registry, Linka constitutes a cornerstone for utilizing Artificial Intelligence and advanced cyber defense in the sustainable technological development of the Palestinian State, scheduled for final exhibition at the 2026 Palestine Cybersecurity & AI Conference.
