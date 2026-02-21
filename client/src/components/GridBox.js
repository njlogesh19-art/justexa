import React from 'react';

const GridBox = ({ icon, title, description, onClick, id }) => {
    return (
        <div className="grid-box" onClick={onClick} id={id} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}>
            <div className="grid-box-icon">{icon}</div>
            <div className="grid-box-title">{title}</div>
            <div className="grid-box-desc">{description}</div>
        </div>
    );
};

export default GridBox;
