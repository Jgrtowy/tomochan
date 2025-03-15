CREATE OR REPLACE FUNCTION setRowNumber()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."rowNumber" IS NULL THEN
    NEW."rowNumber" := (SELECT COALESCE(MAX("rowNumber"), 0) + 1 FROM "names");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER triggerSetRowNumber
BEFORE INSERT ON "names"
FOR EACH ROW
EXECUTE PROCEDURE setRowNumber();

CREATE OR REPLACE FUNCTION reorderRowNumber()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "names"
  SET "rowNumber" = "rowNumber" - 1
  WHERE "rowNumber" > OLD."rowNumber";

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorderRowNumber
AFTER DELETE ON "names"
FOR EACH ROW
EXECUTE PROCEDURE reorderRowNumber();