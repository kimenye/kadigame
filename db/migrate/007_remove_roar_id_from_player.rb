class RemoveRoarIdFromPlayer < ActiveRecord::Migration
  def self.up
    change_table :players do |t|
      t.remove :roar_id
    end
  end

  def self.down
    change_table :players do |t|
      t.string :roar_id
    end
  end
end
