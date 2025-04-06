import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Header() {
    return (
      <header className="pb-3 mb-4 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          {/* Left section: Logo and name */}
          <a
            href="/"
            className="d-flex align-items-center text-body-emphasis text-decoration-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="32"
              className="me-2"
              viewBox="0 0 118 94"
              role="img"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100"
                height="90"
                fill="currentColor"
                className="bi bi-moon-stars-fill"
                viewBox="0 0 16 16"
              >
                <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278" />
                <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z" />
              </svg>
            </svg>
            <span className="fs-4">Apnea-lyze Pro</span>
          </a>
          
          {/* Right section: Users Manual */}
          <p className="mb-0 text-end">
            <a href="https://github.com/rflrydzn/apnealyze-pro" className="text-decoration-none text-black mx-3">Users Manual</a>
            
            <Link to={`/about`} class="text-decoration-none text-black">About</Link>
          </p>

          
        </div>
      </header>
    );
  }
  
  export default Header;