import Button from "../../common/Button";
import "./SummarySection.css";

const SummarySection = ({
  title,
  selected,
  summaryContent,
  isExpanded,
  onToggle,
  children,
}) => {
  const handleToggle = (e) => {
    // If button clicked, won't toggle
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
      return;
    }
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className={`summary-section ${isExpanded ? "expanded" : ""}`}>
      <div className="summary-header" onClick={handleToggle}>
        <div className="summary-title">
          <h3>{title}</h3>
          {!isExpanded && selected && (
            <div className="summary-content">
              {summaryContent}
              <Button variant="text" size="small" onClick={onToggle}>
                Change
              </Button>
            </div>
          )}
        </div>
        {!isExpanded && selected && <div className="summary-badge">✓</div>}
      </div>

      {isExpanded && <div className="summary-expanded-content">{children}</div>}
    </div>
  );
};

export default SummarySection;
