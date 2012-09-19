class AddFieldsToPlayer < ActiveRecord::Migration
  def self.up
    change_table :players do |t|
      t.string :roar_id
    t.datetime :last_logged_in
    end
  end

  def self.down
    change_table :players do |t|
      t.remove :roar_id
    t.remove :last_logged_in
    end
  end
end
