-- set row number after insert

CREATE OR REPLACE FUNCTION setRowNumber()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."rowNumber" IS NULL THEN
    NEW."rowNumber" := (SELECT COALESCE(MAX("rowNumber"), 0) + 1 FROM "names");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS triggerSetRowNumber ON "names";
CREATE TRIGGER triggerSetRowNumber
BEFORE INSERT ON "names"
FOR EACH ROW
EXECUTE PROCEDURE setRowNumber();

-- set row number after delete

CREATE OR REPLACE FUNCTION reorderRowNumber()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "names"
  SET "rowNumber" = "rowNumber" - 1
  WHERE "rowNumber" > OLD."rowNumber";

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reorderRowNumber ON "names";
CREATE TRIGGER reorderRowNumber
AFTER DELETE ON "names"
FOR EACH ROW
EXECUTE PROCEDURE reorderRowNumber();

-- used limit

CREATE OR REPLACE FUNCTION usedLimit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM "used") > 100 THEN
    DELETE FROM "used"
    WHERE "id" = (SELECT "id" FROM "used" ORDER BY "position" ASC LIMIT 1);
    
    UPDATE "used"
    SET "position" = "position" - 1
    WHERE "position" > 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usedLimitTrigger ON "used";
CREATE TRIGGER usedLimitTrigger
AFTER INSERT ON "used"
FOR EACH ROW
EXECUTE FUNCTION usedLimit();