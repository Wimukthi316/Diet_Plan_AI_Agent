const FaviconIcon = ({ className = "w-8 h-8", alt = "Diet Plan AI" }) => (
    <img
        src="/favicon.ico"
        alt={alt}
        className={className}
        style={{
            imageRendering: 'pixelated', // For crisp favicon display
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
        }}
    />
)

export default FaviconIcon
