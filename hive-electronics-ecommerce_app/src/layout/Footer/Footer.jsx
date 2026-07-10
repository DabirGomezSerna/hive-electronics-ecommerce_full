import Icon from "../../components/common/Icon/Icon";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About hiveElectronics</h3>
            <ul>
              <li>
                <a href="placeholder">About us</a>
              </li>
              <li>
                <a href="placeholder">News</a>
              </li>
              <li>
                <a href="placeholder">Mission</a>
              </li>
              <li>
                <a href="placeholder">Contact us</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Customer support</h3>
            <ul>
              <li>
                <a href="placeholder">Help center</a>
              </li>
              <li>
                <a href="placeholder"></a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>My account</h3>
            <ul>
              <li>
                <a href="placeholder">My account</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Follow us</h3>
            <ul>
              <li>
                <a href="placeholder">
                  <Icon className="social-icons" name="facebook" size={20}></Icon>
                </a>
              </li>
              <li>
                <a href="placeholder"><Icon className="social-icons" name="twitter" size={20}></Icon></a>
              </li>
              <li>
                <a href="placeholder"><Icon className="social-icons" name="instagram" size={20}></Icon></a>
              </li>
              <li>
                <a href="placeholder"><Icon className="social-icons" name="youtube" size={20}></Icon></a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} hiveElectronics.com All rights reserved
          </span>
          <nav>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms and conditions</a>
            <a href="/cookies">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
