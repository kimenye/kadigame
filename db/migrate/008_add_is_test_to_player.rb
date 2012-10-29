class AddIsTestToPlayer < ActiveRecord::Migration
  def self.up
    change_table :players do |t|
      t.boolean :is_test
    end
  end

  def self.down
    change_table :players do |t|
      t.remove :is_test
    end
  end
end
