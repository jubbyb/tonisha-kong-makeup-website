import { Link } from 'react-router-dom';

const Navbar = () => {
  const navLinks = (
    <>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/about">About</Link>
      </li>
      <li>
        <Link to="/services">Services</Link>
      </li>
      <li>
        <Link to="/classes">Classes</Link>
      </li>
      {/* <li><Link to="/bookings">Bookings</Link></li> */}
      <li>
        <Link to="/contact">Contact</Link>
      </li>
      <li>
        <Link to="/admin">Admin</Link>
      </li>
    </>
  );

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          Tonisha Kong Makeup
        </Link>
      </div>

      {/* Center menu items on desktop */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-lg menu-horizontal px-1">{navLinks}</ul>
      </div>

      <div className="navbar-end">
        {/* Mobile menu */}
        <div className="dropdown dropdown-end lg:hidden">
          <label tabIndex={0} className="btn btn-ghost" aria-label="Open menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-lg dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-32"
          >
            {navLinks}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
