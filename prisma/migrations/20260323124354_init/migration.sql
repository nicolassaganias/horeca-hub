-- CreateTable
CREATE TABLE "truck_logs" (
    "id" SERIAL NOT NULL,
    "truck_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfid_tags" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "truck_logs_pkey" PRIMARY KEY ("id")
);
