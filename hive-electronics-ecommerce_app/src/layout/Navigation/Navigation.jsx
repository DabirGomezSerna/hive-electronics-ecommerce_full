import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import { fetchCategories } from "../../services/categoryServices";
import "./Navigation.css";

const Navigation = ({ isMobile = false, onLinkClick }) => {
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setAllCategories(data);

        const allParentIds = new Set(
          data
            .filter((cat) => cat.parentCategory)
            .map((cat) => cat.parentCategory._id)
        );

        const mainCategories = data.filter(
          (cat) => !cat.parentCategory || allParentIds.has(cat._id)
        );

        setCategories(mainCategories);
      } catch {
        // navigation still renders without categories
      }
    };

    loadCategories();
  }, []);

  const getSubcategories = (parentId) => {
    const subcategories = allCategories.filter(
      (cat) => cat.parentCategory && cat.parentCategory._id === parentId
    );
    return subcategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Mobile version
  if (isMobile) {
    return (
      <div className="mobile-navigation">
        <Link
          to="/offers"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="tag" size={20} />
          Daily offers
        </Link>
        <Link
          to="/new"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="sparkles" size={20} />
          New
        </Link>
        <Link
          to="/bestsellers"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="star" size={20} />
          Bestsellers
        </Link>
        <Link
          to="/flash-sale"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="zap" size={20} />
          Nvidia special offers
        </Link>

        {/* Main categories */}
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/category/${category._id}`}
            className="mobile-nav-link"
            onClick={onLinkClick}
          >
            <Icon name="chevronRight" size={16} />
            {category.name}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="navigation">
      <div className="container">
        <div className="navigation-content">
          {/* Category menu */}
          <div className="categories-dropdown">
            <button
              className="categories-menu-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            >
              <Icon name="menu" size={16} />
              <span>All categories</span>
              <Icon name="chevronDown" size={14} />
            </button>

            {isDropdownOpen && (
              <div className="categories-dropdown-menu">
                {categories.map((category) => {
                  console.log("hello");
                  const subcategories = getSubcategories(category._id);
                  return (
                    <div key={category._id} className="category-group">
                      <Link
                        to={`/category/${category._id}`}
                        className="category-link main-category"
                      >
                        {category.name}
                        {subcategories.length > 0 && (
                          <Icon name="chevronRight" size={12} />
                        )}
                      </Link>

                      {subcategories.length > 0 && (
                        <div className="subcategories">
                          {subcategories.map((subcat) => (
                            <Link
                              key={subcat._id}
                              to={`/category/${subcat._id}`}
                              className="category-link sub-category"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Horizontal navigation */}
          <nav className="categories-nav">
            <Link to="/offers" className="nav-link special">
              Daily offers
            </Link>
            <Link to="/new" className="nav-link special">
              New
            </Link>
            <Link to="/bestsellers" className="nav-link special">
              Bestsellers
            </Link>
            <Link to="/special-offers" className="nav-link special">
              Nvidia special offers
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
