export interface WatchConfig {
  /**
   * Timeout (in milliseconds) for ctags regeneration to complete. Consider
   * increasing this value if ctags regeneration takes longer on your machine.
   *
   * @requires A non-negative integer.
   */
  ctagsSubProcessTimeoutMs: number;
};
