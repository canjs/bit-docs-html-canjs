module.exports = {
  rectIntersectsWithWindow: function(rect, elementWindow) {
    return (
      rect.top >= this.safeInset.top &&
      rect.top <= (elementWindow.innerHeight - this.safeInset.bottom) &&
      rect.left >= 0 &&
      rect.left <= elementWindow.innerWidth
    );
  },
  safeInset: {
    bottom: 49,
    top: 101
  }
};
