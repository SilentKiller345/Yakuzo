class Structure {
    /**
     * Extends a class.
     * @param name
     * @param extender
     */
     static extend (name,extender) {
      if (!structures[name]) throw new TypeError(`"${name} is not a valid structure`);
      const extended = extender(structures[name]);
      structures[name] = extended;
      return extended;
    }
    /**
     * Get a structure from available structures by name.
     * @param name
     */
    static get(name){
      const structure = structures[name];
      if (!structure) throw new TypeError('"structure" must be provided.');
      return structure;
    }
  }

  const structures = {
    Player: require("./Player"),
    Queue: require("./Queue"),
  };

module.exports = Structure;