import React from 'react';
import './DialpadCard.css';

import dialpadLogo from '../../assets/icons/dialpad-cti/dialpad-logo.png';
import gripVerticalIcon from '../../assets/icons/dialpad-cti/grip-vertical.svg';
import dialpadKeypadImg from '../../assets/icons/dialpad-cti/keypad.jpg';

// Dialpad CTI card, ported from Vinay-Hiver/dialpad-cti (components/MainSidebarPanel.jsx).
// Sits at the bottom of the sidebar; drag by the grip, chevron expands/collapses.

const ChevronUpIcon = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'block' }}>
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Only the Outgoing state is used in this prototype.
const DIALPAD_STATE_CONFIG = {
  outgoing: { border: 'var(--primarySurfaceLighter, #7ea8f6)',   shadow: '0px 0px 2px var(--successSurfaceSubtle, #d3f4e1)', label: 'Dialpad',   bodyImg: dialpadKeypadImg },
};

const DialpadCard = ({ dialpadState = 'outgoing', dialpadExpanded = false }) => {
  const [pos, setPos] = React.useState(null);
  const [isSnapping, setIsSnapping] = React.useState(false);
  const [expandPhase, setExpandPhase] = React.useState('collapsed');
  const [anchor, setAnchor] = React.useState(null);
  const bodyRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 0, y: 0, w: 0, h: 0 });
  const cardRef = React.useRef(null);
  const homeRef = React.useRef(null);

  // body is open during 'expanded' only; 'collapsing' animates both axes simultaneously
  const isExpanded = expandPhase === 'expanded' || expandPhase === 'anchoring';
  const isFixed = expandPhase !== 'collapsed';

  const onMouseDown = (e) => {
    if (e.target.closest('.dialpad-chevron-btn')) return;
    e.preventDefault();
    const rect = cardRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };

    if (isFixed) {
      // Dragging the expanded card — update anchor live
      const onMove = (me) => {
        const PAD = 10;
        const rawX = me.clientX - offsetRef.current.x;
        const rawY = me.clientY - offsetRef.current.y;
        const newX = Math.max(PAD, Math.min(window.innerWidth - offsetRef.current.w - PAD, rawX));
        const newY = Math.max(PAD, Math.min(window.innerHeight - offsetRef.current.h - PAD, rawY));
        setAnchor(prev => ({
          ...prev,
          left: newX,
          top: newY,
          bottom: window.innerHeight - (newY + offsetRef.current.h),
        }));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }

    // Dragging the collapsed card
    if (!pos) homeRef.current = { x: rect.left, y: rect.top };
    setPos({ x: rect.left, y: rect.top });

    const onMove = (me) => {
      const PAD = 10;
      const rawX = me.clientX - offsetRef.current.x;
      const rawY = me.clientY - offsetRef.current.y;
      const newX = Math.max(PAD, Math.min(window.innerWidth - offsetRef.current.w - PAD, rawX));
      const newY = Math.max(PAD, Math.min(window.innerHeight - offsetRef.current.h - PAD, rawY));
      const home = homeRef.current;
      if (home) {
        const dx = newX - home.x;
        const dy = newY - home.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setIsSnapping(true);
          setPos({ x: home.x, y: home.y });
          setTimeout(() => { setPos(null); setIsSnapping(false); }, 100);
          return;
        }
      }
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const isFloating = pos !== null;

  const BODY_HEIGHT = 462;

  const toggleExpand = () => {
    if (expandPhase === 'collapsed') {
      const rect = cardRef.current.getBoundingClientRect();
      const expandDown = rect.top < BODY_HEIGHT + 10;
      setAnchor({
        left: rect.left,
        bottom: window.innerHeight - rect.bottom,
        top: rect.top,
        collapsedWidth: rect.width,
        expandDown,
      });
      setExpandPhase('anchoring');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpandPhase('expanded'));
      });
    } else {
      setExpandPhase('collapsing');
      setTimeout(() => setExpandPhase('collapsed'), 200);
    }
  };

  // Respond to external expand/collapse control
  React.useEffect(() => {
    if (dialpadExpanded && expandPhase === 'collapsed') {
      toggleExpand();
    } else if (!dialpadExpanded && expandPhase !== 'collapsed') {
      setExpandPhase('collapsing');
      setTimeout(() => setExpandPhase('collapsed'), 200);
    }
  }, [dialpadExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const fixedWidth = expandPhase === 'expanded' ? 380 : (anchor?.collapsedWidth ?? 224);

  // When expanded/animating, anchor positioning always wins over floating pos
  const cardStyle = isFixed && anchor
    ? anchor.expandDown
      ? { position: 'fixed', left: anchor.left, top: anchor.top, width: fixedWidth, zIndex: 9998, margin: 0, overflow: 'hidden' }
      : { position: 'fixed', left: anchor.left, bottom: anchor.bottom, width: fixedWidth, zIndex: 9998, margin: 0, overflow: 'hidden' }
    : isFloating
      ? { left: pos.x, top: pos.y, ...(isSnapping ? { transition: 'left 0.1s ease-in-out, top 0.1s ease-in-out' } : {}) }
      : undefined;

  const containerClass = [
    'dialpad-panel',
    isFixed ? 'dialpad-panel--expanded' : '',
    isFloating ? 'dialpad-panel--floating' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {(isFloating || isFixed) && <div className="dialpad-placeholder" />}
      {isFloating && <div className="dialpad-card dialpad-card--placeholder" />}
      <div ref={cardRef} className={containerClass} style={{
        ...cardStyle,
        boxShadow: isFixed
          ? '0px 0px 16px 0px var(--slateSurfaceSubtle300, #cbd5e1)'
          : DIALPAD_STATE_CONFIG[dialpadState]?.shadow,
      }}>
        <div className="dialpad-card" onMouseDown={onMouseDown} style={{
          borderColor: isFixed ? 'var(--slateBorderMild, #edf1f6)' : DIALPAD_STATE_CONFIG[dialpadState]?.border,
        }}>
          <div className="dialpad-card-left">
            <img src={gripVerticalIcon} alt="" width="14" height="14" className="grip-icon" />
            <img src={dialpadLogo} alt="Dialpad" width="18" height="18" className="dialpad-logo" />
            <span className="dialpad-label">{DIALPAD_STATE_CONFIG[dialpadState]?.label}</span>
          </div>
          <button
            className="dialpad-chevron-btn"
            onClick={toggleExpand}
          >
            <ChevronUpIcon className={`dialpad-chevron ${isExpanded ? 'dialpad-chevron--down' : ''}`} />
          </button>
        </div>
        <div
          ref={bodyRef}
          className={`dialpad-body ${isExpanded ? 'dialpad-body--open' : ''}`}
        >
          {DIALPAD_STATE_CONFIG[dialpadState]?.bodyImg ? (
            <img src={DIALPAD_STATE_CONFIG[dialpadState].bodyImg} alt="" className="dialpad-body-incoming-img" />
          ) : (
            <div className="dialpad-body-inner" />
          )}
        </div>
      </div>
    </>
  );
};

export default DialpadCard;
