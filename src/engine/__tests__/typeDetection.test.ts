import { describe, it, expect } from "vitest";
import { detectColumnType, isConstant, isHighCardinality, detectDelimiter, detectEncoding } from "../typeDetection";

describe("detectColumnType", () => {
  it("detects numeric columns", () => {
    const values = ["1.5", "2.3", "3.7", "4.1", "5.9"];
    expect(detectColumnType(values, "price")).toBe("numeric");
  });

  it("detects numeric with commas", () => {
    const values = ["1,000", "2,500", "3,000", "4,500"];
    expect(detectColumnType(values, "amount")).toBe("numeric");
  });

  it("detects categorical columns", () => {
    const values = ["red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green", "red", "blue", "green"];
    expect(detectColumnType(values, "color")).toBe("categorical");
  });

  it("detects boolean columns", () => {
    const values = ["true", "false", "true", "true", "false"];
    expect(detectColumnType(values, "active")).toBe("boolean");
  });

  it("detects boolean with yes/no", () => {
    const values = ["yes", "no", "yes", "yes", "no"];
    expect(detectColumnType(values, "subscribed")).toBe("boolean");
  });

  it("detects datetime columns", () => {
    const values = ["2024-01-15", "2024-02-20", "2024-03-10"];
    expect(detectColumnType(values, "date")).toBe("datetime");
  });

  it("detects text columns", () => {
    const values = [
      "This is a long text description",
      "Another lengthy piece of content here",
      "More detailed text with many words",
    ];
    expect(detectColumnType(values, "description")).toBe("text");
  });

  it("detects empty columns", () => {
    const values: string[] = [];
    expect(detectColumnType(values, "empty")).toBe("empty");
  });

  it("detects empty for null-only values", () => {
    const values = ["null", "NA", "n/a", ""];
    expect(detectColumnType(values, "sparse")).toBe("empty");
  });

  it("detects identifier columns by name", () => {
    const values = Array.from({ length: 100 }, (_, i) => `id_${i}`);
    expect(detectColumnType(values, "user_id")).toBe("identifier");
  });
});

describe("isConstant", () => {
  it("returns true for single value", () => {
    expect(isConstant(1)).toBe(true);
  });

  it("returns false for multiple values", () => {
    expect(isConstant(5)).toBe(false);
  });
});

describe("isHighCardinality", () => {
  it("returns true for near-unique values", () => {
    expect(isHighCardinality(950, 1000)).toBe(true);
  });

  it("returns false for low cardinality", () => {
    expect(isHighCardinality(5, 1000)).toBe(false);
  });
});

describe("detectDelimiter", () => {
  it("detects comma delimiter", () => {
    const content = "a,b,c\n1,2,3\n4,5,6";
    expect(detectDelimiter(content)).toBe(",");
  });

  it("detects tab delimiter", () => {
    const content = "a\tb\tc\n1\t2\t3\n4\t5\t6";
    expect(detectDelimiter(content)).toBe("\t");
  });

  it("detects semicolon delimiter", () => {
    const content = "a;b;c\n1;2;3\n4;5;6";
    expect(detectDelimiter(content)).toBe(";");
  });
});

describe("detectEncoding", () => {
  it("detects ASCII-compatible encoding", () => {
    const buffer = Buffer.from("hello world", "ascii");
    const encoding = detectEncoding(buffer);
    expect(["ascii", "utf-8"]).toContain(encoding);
  });

  it("detects UTF-8", () => {
    const buffer = Buffer.from("héllo wörld", "utf-8");
    expect(detectEncoding(buffer)).toBe("utf-8");
  });
});
